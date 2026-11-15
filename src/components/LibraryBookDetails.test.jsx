import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import LibraryBookDetails from "./LibraryBookDetails";
import * as library from "../api/library";

vi.mock("../api/library");

function renderDetails(id) {
  return render(
    <MemoryRouter initialEntries={[`/library/${id}`]}>
      <Routes>
        <Route path="/library/:id" element={<LibraryBookDetails />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("LibraryBookDetails", () => {
  it("renders the fetched book with its description and subjects", async () => {
    library.getLibraryBook.mockResolvedValue({
      id: "lib-1",
      title: "Detailed Book",
      authors: [{ name: "Someone" }],
      cover_image: "cover.jpg",
      summary: "A short summary.",
      subjects: ["Adventure", "Classics"],
    });

    renderDetails("lib-1");

    expect(
      await screen.findByRole("heading", { name: "Detailed Book" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Someone")).toBeInTheDocument();
    expect(screen.getByText("A short summary.")).toBeInTheDocument();
    expect(screen.getByText("Adventure")).toBeInTheDocument();
    expect(screen.getByText("Classics")).toBeInTheDocument();
  });

  it("links to the uploaded file", async () => {
    library.getLibraryBook.mockResolvedValue({
      id: "lib-1",
      title: "Detailed Book",
      authors: [{ name: "Someone" }],
      fileUrl: "https://example.com/storage/book-files/abc.epub",
      fileName: "Book.epub",
    });

    renderDetails("lib-1");

    await screen.findByRole("heading", { name: "Detailed Book" });

    expect(screen.getByRole("link", { name: "Download" })).toHaveAttribute(
      "href",
      "https://example.com/storage/book-files/abc.epub?download=Book.epub",
    );
  });

  it("shows a not-found message when the book does not exist", async () => {
    library.getLibraryBook.mockResolvedValue(null);

    renderDetails("missing");

    expect(await screen.findByText(/book not found/i)).toBeInTheDocument();
  });

  it("shows an error message when the request fails", async () => {
    library.getLibraryBook.mockRejectedValue(new Error("boom"));

    renderDetails("lib-1");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /could not load this book/i,
    );
  });
});
