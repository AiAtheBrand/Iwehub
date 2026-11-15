import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import BookCard from "./BookCard";

const baseBook = {
  id: 1342,
  title: "Pride and Prejudice",
  authors: [{ name: "Austen, Jane" }],
  cover_image: "cover.jpg",
  download_count: 208430,
};

function renderCard(book, onDelete) {
  return render(
    <MemoryRouter>
      <BookCard book={book} onDelete={onDelete} />
    </MemoryRouter>,
  );
}

describe("BookCard", () => {
  it("renders the title, author and formatted read count", () => {
    renderCard(baseBook);

    expect(
      screen.getByRole("heading", { name: "Pride and Prejudice" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Austen, Jane")).toBeInTheDocument();
    expect(screen.getByText(/208,430 reads/)).toBeInTheDocument();
  });

  it("falls back to a placeholder author when authors is missing", () => {
    renderCard({ ...baseBook, authors: undefined });

    expect(screen.getByText(/unknown author/i)).toBeInTheDocument();
  });

  it("does not crash when download_count is missing", () => {
    renderCard({ ...baseBook, download_count: undefined });

    expect(screen.getByText(/0 reads/)).toBeInTheDocument();
  });

  it("shows a placeholder when there is no cover image", () => {
    renderCard({ ...baseBook, cover_image: "" });

    expect(screen.getByText(/no cover/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: "Pride and Prejudice" }),
    ).not.toBeInTheDocument();
  });

  it("navigates to the detail route when View is clicked", () => {
    function Location() {
      return <div data-testid="location">{useLocation().pathname}</div>;
    }

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<BookCard book={baseBook} />} />
          <Route path="/books/:id" element={<Location />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /view/i }));

    expect(screen.getByTestId("location")).toHaveTextContent("/books/1342");
  });

  it("calls onDelete with the book id", () => {
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

  it("links to the preferred download format", () => {
    renderCard({
      ...baseBook,
      formats: {
        "application/epub+zip": "https://example.com/1342.epub",
        "text/plain; charset=utf-8": "https://example.com/1342.txt",
      },
    });

    const link = screen.getByRole("link", {
      name: /download pride and prejudice/i,
    });

    expect(link).toHaveAttribute("href", "https://example.com/1342.epub");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("hides the download link when no formats are available", () => {
    renderCard(baseBook);

    expect(
      screen.queryByRole("link", { name: /download/i }),
    ).not.toBeInTheDocument();
  });

  it("links to the uploaded file for a shared-library book", () => {
    renderCard({
      ...baseBook,
      source: "library",
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
  });

  it("navigates to the library detail route for a shared-library book", () => {
    function Location() {
      return <div data-testid="location">{useLocation().pathname}</div>;
    }

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route
            path="/"
            element={<BookCard book={{ ...baseBook, source: "library" }} />}
          />
          <Route path="/library/:id" element={<Location />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /view/i }));

    expect(screen.getByTestId("location")).toHaveTextContent("/library/1342");
  });
});
