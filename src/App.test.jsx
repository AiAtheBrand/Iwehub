import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import * as api from "./api/books";

vi.mock("./api/books");

function renderApp() {
  return render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );
}

describe("App", () => {
  it("shows a loading state, then renders the fetched books", async () => {
    api.getBooks.mockResolvedValue([
      {
        id: 1,
        title: "Book One",
        authors: [{ name: "Author One" }],
        download_count: 5,
        cover_image: "",
      },
    ]);

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
});
