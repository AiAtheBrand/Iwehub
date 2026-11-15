import { useNavigate } from "react-router-dom";
import { getDownload } from "../lib/download";

function BookCard({ book, onDelete }) {
  const navigate = useNavigate();
  const author = book.authors?.[0]?.name ?? "Unknown author";
  const download = getDownload(book);

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:border-blue-900">
      <div className="bg-gray-50">
        {book.cover_image ? (
          <img
            src={book.cover_image}
            alt={book.title}
            className="h-72 w-full object-cover"
          />
        ) : (
          <div className="flex h-72 w-full items-center justify-center text-sm text-gray-400">
            No cover
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h2 className="line-clamp-2 text-base font-semibold text-gray-900">
          {book.title}
        </h2>

        <p className="mt-1 text-sm text-gray-500">{author}</p>

        <div className="mt-auto flex flex-wrap items-center justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={() => navigate(`/library/${book.id}`)}
            className="rounded-md bg-blue-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-800"
          >
            View
          </button>

          {download && (
            <a
              href={download.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Download ${book.title}`}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              Download
            </a>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(book)}
              aria-label={`Delete ${book.title}`}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default BookCard;
