import { useRef, useState } from "react";

/**
 * A small form that lets the user add a book to the local grid.
 * The public API is read-only, so added books live only in the app state.
 * The cover image is read from the chosen file and stored as a data URL.
 */
function AddBookForm({ onAdd }) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const fileInputRef = useRef(null);

  function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      setCoverImage("");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setCoverImage(String(reader.result));
    reader.readAsDataURL(file);
  }

  function handleSubmit(event) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const trimmedAuthor = author.trim();

    onAdd({
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: trimmedTitle,
      authors: trimmedAuthor ? [{ name: trimmedAuthor }] : [],
      cover_image: coverImage,
      download_count: 0,
    });

    setTitle("");
    setAuthor("");
    setCoverImage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
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
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          aria-label="Cover image"
          className="text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-600"
        />

        {coverImage && (
          <img
            src={coverImage}
            alt="Cover preview"
            className="h-16 w-12 rounded object-cover ring-1 ring-gray-200"
          />
        )}

        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 sm:ml-auto"
        >
          Add book
        </button>
      </div>
    </form>
  );
}

export default AddBookForm;
