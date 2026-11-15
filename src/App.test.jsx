import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import AuthGate from "./components/AuthGate";
import LibraryBookDetails from "./components/LibraryBookDetails";
import * as library from "./api/library";
import { useAuth } from "./hooks/useAuth";

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

function makeLibraryBook(overrides) {
  return {
    id: "lib-1",
    title: "Shared Book",
    authors: [{ name: "Someone" }],
    cover_image: "",
    download_count: 0,
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
          <Route path="/library/:id" element={<LibraryBookDetails />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("App", () => {
  beforeEach(() => {
    library.listLibraryBooks.mockReset().mockResolvedValue([]);
    library.getLibraryBook.mockReset();
    library.addLibraryBook.mockReset();
    library.deleteLibraryBook.mockReset().mockResolvedValue(undefined);
    useAuth.mockReturnValue(authState());
  });

  it("shows a loading state, then renders the fetched books", async () => {
    library.listLibraryBooks.mockResolvedValue([makeLibraryBook()]);

    renderApp();

    expect(screen.getByRole("status")).toHaveTextContent(/loading/i);
    expect(
      await screen.findByRole("heading", { name: "Shared Book" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/1 book/i)).toBeInTheDocument();
  });

  it("shows an error message when the request fails", async () => {
    library.listLibraryBooks.mockRejectedValue(new Error("boom"));

    renderApp();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /could not load books/i,
    );
  });

  it("shows an empty state when no books are returned", async () => {
    renderApp();

    expect(await screen.findByText(/no books found/i)).toBeInTheDocument();
  });

  it("filters books by the search term", async () => {
    const user = userEvent.setup();
    library.listLibraryBooks.mockResolvedValue([
      makeLibraryBook({
        id: "lib-1",
        title: "Pride and Prejudice",
        authors: [{ name: "Austen, Jane" }],
      }),
      makeLibraryBook({
        id: "lib-2",
        title: "Frankenstein",
        authors: [{ name: "Shelley, Mary" }],
      }),
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
    expect(screen.getByText(/1 book/i)).toBeInTheDocument();
  });

  it("shows the signed-in user and the add button when authenticated", async () => {
    renderApp();

    await screen.findByText(/no books found/i);

    expect(screen.getByText("reader@example.com")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^add book$/i }),
    ).toBeInTheDocument();
  });

  it("hides the add button and form when signed out", async () => {
    useAuth.mockReturnValue(authState({ user: null }));

    renderApp();

    await screen.findByRole("heading", { name: /sign in/i });

    expect(
      screen.queryByRole("button", { name: /^add book$/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Book title")).not.toBeInTheDocument();
  });

  it("shows the auth form and hides the library when signed out", async () => {
    useAuth.mockReturnValue(authState({ user: null }));
    library.listLibraryBooks.mockResolvedValue([makeLibraryBook()]);

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
      screen.queryByRole("heading", { name: "Shared Book" }),
    ).not.toBeInTheDocument();
  });

  it("shows a loading state while the session is being checked", () => {
    useAuth.mockReturnValue(authState({ user: null, loading: true }));

    renderApp();

    expect(screen.getByRole("status")).toHaveTextContent(/loading/i);
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
  });

  it("gates the library detail route behind sign-in", async () => {
    useAuth.mockReturnValue(authState({ user: null }));

    renderApp(["/library/lib-1"]);

    expect(
      await screen.findByRole("heading", { name: /sign in/i }),
    ).toBeInTheDocument();
    expect(library.getLibraryBook).not.toHaveBeenCalled();
  });

  it("renders the library detail route for a signed-in user", async () => {
    library.getLibraryBook.mockResolvedValue(
      makeLibraryBook({ title: "Detailed Book" }),
    );

    renderApp(["/library/lib-1"]);

    expect(
      await screen.findByRole("heading", { name: "Detailed Book" }),
    ).toBeInTheDocument();
    expect(library.getLibraryBook).toHaveBeenCalledWith("lib-1");
  });

  it("reveals the add form only after clicking Add book", async () => {
    const user = userEvent.setup();

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
    library.listLibraryBooks.mockResolvedValue([
      makeLibraryBook({ ownerId: "someone-else" }),
    ]);

    renderApp();

    await screen.findByRole("heading", { name: "Shared Book" });

    expect(
      screen.queryByRole("button", { name: /delete shared book/i }),
    ).not.toBeInTheDocument();
  });
});
