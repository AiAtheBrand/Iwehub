import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import BookCard from "./BookCard";

const baseBook = {
  id: 1342,
  title: "Pride and Prejudice",
  authors: [{ name: "Austen, Jane" }],
  cover_image: "cover.jpg",
  download_count: 208430,
};

function renderCard(book) {
  return render(
    <MemoryRouter>
      <BookCard book={book} />
    </MemoryRouter>,
  );
}

describe("BookCard", () => {
  it("renders the title, author and formatted download count", () => {
    renderCard(baseBook);

    expect(
      screen.getByRole("heading", { name: "Pride and Prejudice" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Austen, Jane")).toBeInTheDocument();
    expect(screen.getByText(/208,430/)).toBeInTheDocument();
  });

  it("falls back to a placeholder author when authors is missing", () => {
    renderCard({ ...baseBook, authors: undefined });

    expect(screen.getByText(/unknown author/i)).toBeInTheDocument();
  });

  it("does not crash when download_count is missing", () => {
    renderCard({ ...baseBook, download_count: undefined });

    expect(screen.getByText(/0 downloads/)).toBeInTheDocument();
  });

  it("links to the book detail route", () => {
    renderCard(baseBook);

    expect(screen.getByRole("link", { name: /view/i })).toHaveAttribute(
      "href",
      "/books/1342",
    );
  });
});
