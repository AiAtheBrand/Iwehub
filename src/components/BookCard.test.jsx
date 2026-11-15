import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import BookCard from "./BookCard";

const baseBook = {
  id: "lib-1",
  title: "Pride and Prejudice",
  authors: [{ name: "Austen, Jane" }],
  cover_image: "cover.jpg",
};

function renderCard(book, onDelete) {
  return render(
    <MemoryRouter>
      <BookCard book={book} onDelete={onDelete} />
    </MemoryRouter>,
  );
}

describe("BookCard", () => {
  it("renders the title and author", () => {
    renderCard(baseBook);

    expect(
      screen.getByRole("heading", { name: "Pride and Prejudice" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Austen, Jane")).toBeInTheDocument();
  });

  it("falls back to a placeholder author when authors is missing", () => {
    renderCard({ ...baseBook, authors: undefined });

    expect(screen.getByText(/unknown author/i)).toBeInTheDocument();
  });

  it("shows a placeholder when there is no cover image", () => {
    renderCard({ ...baseBook, cover_image: "" });

    expect(screen.getByText(/no cover/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: "Pride and Prejudice" }),
    ).not.toBeInTheDocument();
  });

  it("navigates to the library detail route when View is clicked", () => {
    function Location() {
      return <div data-testid="location">{useLocation().pathname}</div>;
    }

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<BookCard book={baseBook} />} />
          <Route path="/library/:id" element={<Location />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /view/i }));

    expect(screen.getByTestId("location")).toHaveTextContent("/library/lib-1");
  });

  it("calls onDelete with the book", () => {
    const onDelete = vi.fn();
    renderCard(baseBook, onDelete);

    fireEvent.click(
      screen.getByRole("button", { name: /delete pride and prejudice/i }),
    );

    expect(onDelete).toHaveBeenCalledWith(baseBook);
  });

  it("hides the delete button when no handler is provided", () => {
    renderCard(baseBook);

    expect(
      screen.queryByRole("button", { name: /delete/i }),
    ).not.toBeInTheDocument();
  });

  it("links to the uploaded file", () => {
    renderCard({
      ...baseBook,
      fileUrl: "https://example.com/storage/book-files/abc.epub",
      fileName: "Pride.epub",
    });

    const link = screen.getByRole("link", {
      name: /download pride and prejudice/i,
    });

    expect(link).toHaveAttribute(
      "href",
      "https://example.com/storage/book-files/abc.epub?download=Pride.epub",
    );
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("hides the download link when the book has no uploaded file", () => {
    renderCard(baseBook);

    expect(
      screen.queryByRole("link", { name: /download/i }),
    ).not.toBeInTheDocument();
  });
});
