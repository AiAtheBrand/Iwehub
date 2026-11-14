import { useState } from "react";

/**
 * A small form that lets the user add a book to the local grid.
 * The public API is read-only, so added books live only in the app state.
 */
function AddBookForm({ onAdd }) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const trimmedAuthor = author.trim();

    onAdd({
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: trimmedTitle,
      authors: trimmedAuthor ? [{ name: trimmedAuthor }] : [],
      cover_image: "",
      download_count: 0,
    });

    setTitle("");
    setAuthor("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 flex flex-col gap-3 sm:flex-row"
    >
      <input
        type="text"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Book title"
        aria-label="Book title"
        className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500"
      />

      <input
        type="text"
        value={author}
        onChange={(event) => setAuthor(event.target.value)}
        placeholder="Author (optional)"
        aria-label="Author"
        className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500"
      />

      <button
        type="submit"
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
      >
        Add book
      </button>
    </form>
  );
}

export default AddBookForm;
