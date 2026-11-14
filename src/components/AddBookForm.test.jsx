import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddBookForm from "./AddBookForm";

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
});
