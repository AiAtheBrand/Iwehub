import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddBookForm from "./AddBookForm";

const pngFile = new File(["fake-bytes"], "cover.png", { type: "image/png" });
const epubFile = new File(["fake-epub"], "book.epub", {
  type: "application/epub+zip",
});

describe("AddBookForm", () => {
  it("calls onAdd with a new book and clears the fields", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<AddBookForm onAdd={onAdd} />);

    await user.type(screen.getByLabelText("Book title"), "My New Book");
    await user.type(screen.getByLabelText("Author"), "Jane Doe");
    await user.click(screen.getByRole("button", { name: /add book/i }));

    expect(onAdd).toHaveBeenCalledOnce();

    const added = onAdd.mock.calls[0][0];
    expect(added.title).toBe("My New Book");
    expect(added.authors).toEqual([{ name: "Jane Doe" }]);
    expect(added.download_count).toBe(0);

    expect(screen.getByLabelText("Book title")).toHaveValue("");
    expect(screen.getByLabelText("Author")).toHaveValue("");
  });

  it("does not call onAdd when the title is empty", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<AddBookForm onAdd={onAdd} />);

    await user.click(screen.getByRole("button", { name: /add book/i }));

    expect(onAdd).not.toHaveBeenCalled();
  });

  it("omits authors when no author is provided", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<AddBookForm onAdd={onAdd} />);

    await user.type(screen.getByLabelText("Book title"), "Anonymous Work");
    await user.click(screen.getByRole("button", { name: /add book/i }));

    expect(onAdd.mock.calls[0][0].authors).toEqual([]);
  });

  it("includes the uploaded image as a data URL", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<AddBookForm onAdd={onAdd} />);

    await user.type(screen.getByLabelText("Book title"), "Illustrated Book");
    await user.upload(screen.getByLabelText("Cover image"), pngFile);

    // Preview only appears once the FileReader has finished.
    expect(await screen.findByAltText("Cover preview")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /add book/i }));

    const added = onAdd.mock.calls[0][0];
    expect(added.cover_image).toMatch(/^data:image\/png;base64,/);
  });

  it("uses an empty cover when no image is selected", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<AddBookForm onAdd={onAdd} />);

    await user.type(screen.getByLabelText("Book title"), "Plain Book");
    await user.click(screen.getByRole("button", { name: /add book/i }));

    expect(onAdd.mock.calls[0][0].cover_image).toBe("");
  });

  it("clears the selected image after adding", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<AddBookForm onAdd={onAdd} />);

    await user.type(screen.getByLabelText("Book title"), "Illustrated Book");
    await user.upload(screen.getByLabelText("Cover image"), pngFile);
    await screen.findByAltText("Cover preview");

    await user.click(screen.getByRole("button", { name: /add book/i }));

    expect(screen.queryByAltText("Cover preview")).not.toBeInTheDocument();
  });

  it("includes the chosen book file in the draft", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<AddBookForm onAdd={onAdd} />);

    await user.type(screen.getByLabelText("Book title"), "Illustrated Book");
    await user.upload(screen.getByLabelText("Book file"), epubFile);
    await user.click(screen.getByRole("button", { name: /add book/i }));

    const added = onAdd.mock.calls[0][0];
    expect(added.file).toBe(epubFile);
    expect(added.file_name).toBe("book.epub");
  });

  it("omits the book file when none is selected", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<AddBookForm onAdd={onAdd} />);

    await user.type(screen.getByLabelText("Book title"), "Plain Book");
    await user.click(screen.getByRole("button", { name: /add book/i }));

    expect(onAdd.mock.calls[0][0].file).toBeNull();
    expect(onAdd.mock.calls[0][0].file_name).toBe("");
  });

  it("clears the chosen book file after adding", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<AddBookForm onAdd={onAdd} />);

    await user.type(screen.getByLabelText("Book title"), "Illustrated Book");
    await user.upload(screen.getByLabelText("Book file"), epubFile);

    expect(screen.getByText("book.epub")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /add book/i }));

    expect(screen.queryByText("book.epub")).not.toBeInTheDocument();
  });
});
