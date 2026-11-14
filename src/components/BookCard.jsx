import { useNavigate } from "react-router-dom";

function BookCard({ book, onDelete }) {
  const navigate = useNavigate();
  const author = book.authors?.[0]?.name ?? "Unknown author";
  const downloads = book.download_count ?? 0;

  return (
    <article className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative overflow-hidden bg-gray-100">
        {book.cover_image ? (
          <img
            src={book.cover_image}
            alt={book.title}
            className="h-80 w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-80 w-full items-center justify-center text-sm text-gray-400">
            No cover
          </div>
        )}
      </div>

      <div className="p-5">
        <h2 className="line-clamp-2 text-lg font-bold text-gray-900">
          {book.title}
        </h2>

        <p className="mt-2 text-sm text-gray-500">{author}</p>

        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="text-sm text-gray-400">
            {downloads.toLocaleString()} reads
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`/books/${book.id}`)}
              className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
            >
              View
            </button>

            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(book.id)}
                aria-label={`Delete ${book.title}`}
                className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default BookCard;
