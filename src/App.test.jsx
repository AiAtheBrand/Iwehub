import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import * as api from "./api/books";

vi.mock("./api/books");

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

function renderApp() {
  return render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );
}

describe("App", () => {
  beforeEach(() => {
    api.getBooks.mockReset();
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

  it("adds a book through the form", async () => {
    const user = userEvent.setup();
    api.getBooks.mockResolvedValue([]);

    renderApp();

    await screen.findByText(/no books found/i);

    await user.type(screen.getByLabelText("Book title"), "My New Book");
    await user.click(screen.getByRole("button", { name: /add book/i }));

    expect(
      screen.getByRole("heading", { name: "My New Book" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/number of books: 1/i)).toBeInTheDocument();
  });

  it("deletes a book from the grid", async () => {
    const user = userEvent.setup();
    api.getBooks.mockResolvedValue([makeBook()]);

    renderApp();

    await screen.findByRole("heading", { name: "Book One" });

    await user.click(
      screen.getByRole("button", { name: /delete book one/i }),
    );

    expect(
      screen.queryByRole("heading", { name: "Book One" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/no books found/i)).toBeInTheDocument();
  });
});
