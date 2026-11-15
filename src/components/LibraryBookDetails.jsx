import { Link, useParams } from "react-router-dom";
import { useLibraryBook } from "../hooks/useLibraryBook";
import { getDownload } from "../lib/download";

/**
 * Detail page for a book from the shared library (one users added).
 * A library book has a single uploaded file, so it shows one Download button.
 */
function LibraryBookDetails() {
  const { id } = useParams();
  const { book, loading, error } = useLibraryBook(id);
  const download = book ? getDownload(book) : null;

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <Link to="/" className="text-sm font-medium text-blue-600 hover:underline">
        ← Back to books
      </Link>

      {loading && (
        <p className="mt-4 text-gray-600" role="status">
          Loading book…
        </p>
      )}

      {error && (
        <p className="mt-4 text-red-600" role="alert">
          Could not load this book. Please try again later.
        </p>
      )}

      {!loading && !error && !book && (
        <p className="mt-4 text-gray-600">Book not found.</p>
      )}

      {!loading && !error && book && (
        <article className="mt-6 flex flex-col gap-8 md:flex-row">
          {book.cover_image && (
            <img
              src={book.cover_image}
              alt={book.title}
              className="w-full max-w-xs rounded-2xl shadow-sm ring-1 ring-gray-200 md:w-64"
            />
          )}

          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{book.title}</h1>

            <p className="mt-2 text-gray-600">
              {book.authors?.[0]?.name ?? "Unknown author"}
            </p>

            {book.summary && (
              <p className="mt-6 leading-relaxed text-gray-700">
                {book.summary}
              </p>
            )}

            {Array.isArray(book.subjects) && book.subjects.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-2">
                {book.subjects.map((subject) => (
                  <li
                    key={subject}
                    className="rounded-full bg-white px-3 py-1 text-xs text-gray-600 ring-1 ring-gray-200"
                  >
                    {subject}
                  </li>
                ))}
              </ul>
            )}

            {download && (
              <div className="mt-6">
                <h2 className="text-sm font-semibold text-gray-900">
                  Download
                </h2>
                <div className="mt-2">
                  <a
                    href={download.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                  >
                    {download.label}
                  </a>
                </div>
              </div>
            )}
          </div>
        </article>
      )}
    </div>
  );
}

export default LibraryBookDetails;
