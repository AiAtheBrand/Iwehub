import { useRef, useState } from "react";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "../lib/limits";

/**
 * A small form that adds a book to the shared library.
 * The cover image is read from the chosen file and stored as a data URL so it
 * can be previewed; the book file itself is kept as a File and uploaded by the
 * API layer.
 *
 * Files larger than MAX_UPLOAD_BYTES are rejected here so the user finds out
 * immediately, before anything is uploaded.
 */
function AddBookForm({ onAdd }) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [summary, setSummary] = useState("");
  const [subjects, setSubjects] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [bookFile, setBookFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef(null);
  const bookFileInputRef = useRef(null);

  function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      setCoverImage("");
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setFileError(`Cover image must be ${MAX_UPLOAD_LABEL} or smaller.`);
      setCoverImage("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setFileError("");
    const reader = new FileReader();
    reader.onload = () => setCoverImage(String(reader.result));
    reader.readAsDataURL(file);
  }

  function handleBookFileChange(event) {
    const file = event.target.files?.[0] ?? null;

    if (file && file.size > MAX_UPLOAD_BYTES) {
      setFileError(`Book file must be ${MAX_UPLOAD_LABEL} or smaller.`);
      setBookFile(null);
      if (bookFileInputRef.current) bookFileInputRef.current.value = "";
      return;
    }

    setFileError("");
    setBookFile(file);
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
      summary: summary.trim(),
      // "Adventure, Classics" -> ["Adventure", "Classics"]
      subjects: subjects
        .split(",")
        .map((subject) => subject.trim())
        .filter(Boolean),
      cover_image: coverImage,
      file: bookFile,
      file_name: bookFile?.name ?? "",
      download_count: 0,
    });

    setTitle("");
    setAuthor("");
    setSummary("");
    setSubjects("");
    setCoverImage("");
    setBookFile(null);
    setFileError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (bookFileInputRef.current) bookFileInputRef.current.value = "";
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

      <textarea
        value={summary}
        onChange={(event) => setSummary(event.target.value)}
        placeholder="Description (optional)"
        aria-label="Description"
        rows={3}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500"
      />

      <input
        type="text"
        value={subjects}
        onChange={(event) => setSubjects(event.target.value)}
        placeholder="Subjects, separated by commas (optional)"
        aria-label="Subjects"
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500"
      />

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
      </div>

      {fileError && (
        <p role="alert" className="text-sm text-red-600">
          {fileError}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          ref={bookFileInputRef}
          type="file"
          accept=".epub,.pdf,.mobi,.azw3,.fb2,.txt,.zip,application/epub+zip,application/pdf,text/plain"
          onChange={handleBookFileChange}
          aria-label="Book file"
          className="text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-600"
        />

        {bookFile && (
          <span className="truncate text-sm text-gray-500" title={bookFile.name}>
            {bookFile.name}
          </span>
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
