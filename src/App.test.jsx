import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import AuthGate from "./components/AuthGate";
import BookDetails from "./components/BookDetails";
import LibraryBookDetails from "./components/LibraryBookDetails";
import * as api from "./api/books";
import * as library from "./api/library";
import { useAuth } from "./hooks/useAuth";

vi.mock("./api/books");
vi.mock("./api/library");
vi.mock("./hooks/useAuth");

const USER = { id: "user-1", email: "reader@example.com" };

/** Build a `useAuth` return value; signed in by default. */
function authState(overrides = {}) {
  return {
    user: USER,
    loading: false,
    configured: true,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    ...overrides,
  };
}

function makeBook(overrides) {
  return {
    id: 1,
    title: "Book One",
    authors: [{ name: "Author One" }],
    download_count: 5,
    cover_image: "",
    ...overrides,
  };
}

function makeLibraryBook(overrides) {
  return {
    id: "lib-1",
    title: "Shared Book",
    authors: [{ name: "Someone" }],
    cover_image: "",
    download_count: 0,
    source: "library",
    ownerId: USER.id,
    ...overrides,
  };
}

function renderApp(initialEntries = ["/"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route element={<AuthGate />}>
          <Route path="/" element={<App />} />
          <Route path="/books/:id" element={<BookDetails />} />
          <Route path="/library/:id" element={<LibraryBookDetails />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("App", () => {
  beforeEach(() => {
    api.getBooks.mockReset();
    api.getBook.mockReset();
    library.listLibraryBooks.mockReset().mockResolvedValue([]);
    library.getLibraryBook.mockReset();
    library.addLibraryBook.mockReset();
    library.deleteLibraryBook.mockReset().mockResolvedValue(undefined);
    useAuth.mockReturnValue(authState());
  });

  it("shows a loading state, then renders the fetched books", async () => {
    api.getBooks.mockResolvedValue([makeBook()]);

    renderApp();

    expect(screen.getByRole("status")).toHaveTextContent(/loading/i);
    expect(
      await screen.findByRole("heading", { name: "Book One" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/number of books: 1/i)).toBeInTheDocument();
  });

  it("shows an error message when the request fails", async () => {
    api.getBooks.mockRejectedValue(new Error("boom"));

    renderApp();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /could not load books/i,
    );
  });

  it("shows an empty state when no books are returned", async () => {
    api.getBooks.mockResolvedValue([]);

    renderApp();

    expect(await screen.findByText(/no books found/i)).toBeInTheDocument();
  });

  it("filters books by the search term", async () => {
    const user = userEvent.setup();
    api.getBooks.mockResolvedValue([
      makeBook({ id: 1, title: "Pride and Prejudice", authors: [{ name: "Austen, Jane" }] }),
      makeBook({ id: 2, title: "Frankenstein", authors: [{ name: "Shelley, Mary" }] }),
    ]);

    renderApp();

    await screen.findByRole("heading", { name: "Pride and Prejudice" });

    await user.type(screen.getByLabelText("Search books"), "franken");

    expect(
      screen.getByRole("heading", { name: "Frankenstein" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Pride and Prejudice" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/number of books: 1/i)).toBeInTheDocument();
  });

  it("shows the signed-in user and the add button when authenticated", async () => {
    api.getBooks.mockResolvedValue([]);

    renderApp();

    await screen.findByText(/no books found/i);

    expect(screen.getByText(/signed in as reader@example.com/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^add book$/i }),
    ).toBeInTheDocument();
  });

  it("hides the add button and form when signed out", async () => {
    useAuth.mockReturnValue(authState({ user: null }));
    api.getBooks.mockResolvedValue([]);

    renderApp();

    await screen.findByRole("heading", { name: /sign in/i });

    expect(
      screen.queryByRole("button", { name: /^add book$/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Book title")).not.toBeInTheDocument();
  });

  it("shows the auth form and hides the library when signed out", async () => {
    useAuth.mockReturnValue(authState({ user: null }));
    api.getBooks.mockResolvedValue([makeBook()]);

    renderApp();

    expect(
      await screen.findByRole("heading", { name: /sign in/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();

    // The library itself is gated behind sign-in.
    expect(
      screen.queryByRole("searchbox", { name: "Search books" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Book One" }),
    ).not.toBeInTheDocument();
  });

  it("shows a loading state while the session is being checked", () => {
    useAuth.mockReturnValue(authState({ user: null, loading: true }));
    api.getBooks.mockResolvedValue([]);

    renderApp();

    expect(screen.getByRole("status")).toHaveTextContent(/loading/i);
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
  });

  it("gates the catalogue detail route behind sign-in", async () => {
    useAuth.mockReturnValue(authState({ user: null }));

    renderApp(["/books/1342"]);

    expect(
      await screen.findByRole("heading", { name: /sign in/i }),
    ).toBeInTheDocument();
    expect(api.getBook).not.toHaveBeenCalled();
  });

  it("gates the library detail route behind sign-in", async () => {
    useAuth.mockReturnValue(authState({ user: null }));

    renderApp(["/library/lib-1"]);

    expect(
      await screen.findByRole("heading", { name: /sign in/i }),
    ).toBeInTheDocument();
    expect(library.getLibraryBook).not.toHaveBeenCalled();
  });

  it("renders a detail route for a signed-in user", async () => {
    api.getBook.mockResolvedValue(makeBook({ title: "Book One" }));

    renderApp(["/books/1"]);

    expect(
      await screen.findByRole("heading", { name: "Book One" }),
    ).toBeInTheDocument();
    expect(api.getBook).toHaveBeenCalledWith("1");
  });

  it("reveals the add form only after clicking Add book", async () => {
    const user = userEvent.setup();
    api.getBooks.mockResolvedValue([]);

    renderApp();

    await screen.findByText(/no books found/i);

    expect(screen.queryByLabelText("Book title")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^add book$/i }));

    expect(screen.getByLabelText("Book title")).toBeInTheDocument();
    expect(screen.getByLabelText("Author")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
    expect(screen.getByLabelText("Subjects")).toBeInTheDocument();
    expect(screen.getByLabelText("Cover image")).toBeInTheDocument();
    expect(screen.getByLabelText("Book file")).toBeInTheDocument();
  });

  it("adds a book to the shared library and hides the form", async () => {
    const user = userEvent.setup();
    api.getBooks.mockResolvedValue([]);
    library.addLibraryBook.mockResolvedValue(
      makeLibraryBook({ id: "lib-new", title: "My New Book" }),
    );

    renderApp();

    await screen.findByText(/no books found/i);

    await user.click(screen.getByRole("button", { name: /^add book$/i }));
    await user.type(screen.getByLabelText("Book title"), "My New Book");
    await user.click(screen.getByRole("button", { name: /^add book$/i }));

    expect(
      await screen.findByRole("heading", { name: "My New Book" }),
    ).toBeInTheDocument();
    expect(library.addLibraryBook).toHaveBeenCalledOnce();
    expect(screen.queryByLabelText("Book title")).not.toBeInTheDocument();
  });

  it("deletes a shared library book the user owns", async () => {
    const user = userEvent.setup();
    api.getBooks.mockResolvedValue([]);
    library.listLibraryBooks.mockResolvedValue([makeLibraryBook()]);

    renderApp();

    await screen.findByRole("heading", { name: "Shared Book" });

    await user.click(
      screen.getByRole("button", { name: /delete shared book/i }),
    );

    expect(library.deleteLibraryBook).toHaveBeenCalledWith("lib-1");
    expect(
      screen.queryByRole("heading", { name: "Shared Book" }),
    ).not.toBeInTheDocument();
  });

  it("hides the delete button on books owned by someone else", async () => {
    api.getBooks.mockResolvedValue([]);
    library.listLibraryBooks.mockResolvedValue([
      makeLibraryBook({ ownerId: "someone-else" }),
    ]);

    renderApp();

    await screen.findByRole("heading", { name: "Shared Book" });

    expect(
      screen.queryByRole("button", { name: /delete shared book/i }),
    ).not.toBeInTheDocument();
  });

  it("deletes a Gutenberg book locally", async () => {
    const user = userEvent.setup();
    api.getBooks.mockResolvedValue([makeBook()]);

    renderApp();

    await screen.findByRole("heading", { name: "Book One" });

    await user.click(
      screen.getByRole("button", { name: /delete book one/i }),
    );

    expect(library.deleteLibraryBook).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("heading", { name: "Book One" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/no books found/i)).toBeInTheDocument();
  });

  it("persists Gutenberg deletions across remounts", async () => {
    const user = userEvent.setup();
    api.getBooks.mockResolvedValue([makeBook()]);

    const { unmount } = renderApp();
    await screen.findByRole("heading", { name: "Book One" });

    await user.click(screen.getByRole("button", { name: /delete book one/i }));

    unmount();

    api.getBooks.mockResolvedValue([makeBook()]);
    renderApp();

    expect(await screen.findByText(/no books found/i)).toBeInTheDocument();
  });
});
