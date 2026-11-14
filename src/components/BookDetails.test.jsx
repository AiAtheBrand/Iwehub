import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import BookDetails from "./BookDetails";
import * as api from "../api/books";

vi.mock("../api/books");

function renderDetails(id) {
  return render(
    <MemoryRouter initialEntries={[`/books/${id}`]}>
      <Routes>
        <Route path="/books/:id" element={<BookDetails />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("BookDetails", () => {
  it("renders the fetched book and passes the route id to the api", async () => {
    api.getBook.mockResolvedValue({
      id: 1342,
      title: "Pride and Prejudice",
      authors: [{ name: "Austen, Jane" }],
      summary: "A classic novel.",
      subjects: ["Romance"],
      download_count: 1000,
      cover_image: "cover.jpg",
    });

    renderDetails(1342);

    expect(
      await screen.findByRole("heading", { name: "Pride and Prejudice" }),
    ).toBeInTheDocument();
    expect(screen.getByText("A classic novel.")).toBeInTheDocument();
    expect(api.getBook).toHaveBeenCalledWith("1342");
  });

  it("shows a not-found message when the book does not exist", async () => {
    api.getBook.mockResolvedValue(null);

    renderDetails(999);

    expect(await screen.findByText(/book not found/i)).toBeInTheDocument();
  });

  it("shows an error message when the request fails", async () => {
    api.getBook.mockRejectedValue(new Error("boom"));

    renderDetails(1);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /could not load this book/i,
    );
  });

  it("shows a download link for each available format", async () => {
    api.getBook.mockResolvedValue({
      id: 1342,
      title: "Pride and Prejudice",
      authors: [{ name: "Austen, Jane" }],
      formats: {
        "application/epub+zip": "https://example.com/1342.epub",
        "text/plain; charset=utf-8": "https://example.com/1342.txt",
      },
    });

    renderDetails(1342);

    await screen.findByRole("heading", { name: "Pride and Prejudice" });

    expect(screen.getByRole("link", { name: "EPUB" })).toHaveAttribute(
      "href",
      "https://example.com/1342.epub",
    );
    expect(screen.getByRole("link", { name: "Plain text" })).toHaveAttribute(
      "href",
      "https://example.com/1342.txt",
    );
  });

  it("shows no download section when the book has no formats", async () => {
    api.getBook.mockResolvedValue({
      id: 1342,
      title: "Pride and Prejudice",
      authors: [{ name: "Austen, Jane" }],
    });

    renderDetails(1342);

    await screen.findByRole("heading", { name: "Pride and Prejudice" });

    expect(
      screen.queryByRole("heading", { name: "Download" }),
    ).not.toBeInTheDocument();
  });
});
