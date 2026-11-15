import { useMemo, useState } from "react";
import BookCard from "./BookCard";
import AddBookForm from "./AddBookForm";
import { useLibraryBooks } from "../hooks/useLibraryBooks";

/**
 * The signed-in experience: the shared library of uploaded books, plus search,
 * add and delete. Mounted only for authenticated users.
 */
function Library({ user, onSignOut }) {
  const {
    books: libraryBooks,
    loading,
    error,
    addBook,
    removeBook,
  } = useLibraryBooks();

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Apply the search term to the title or the first author.
  const books = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return libraryBooks;

    return libraryBooks.filter((book) => {
      const title = book.title?.toLowerCase() ?? "";
      const author = book.authors?.[0]?.name?.toLowerCase() ?? "";
      return title.includes(term) || author.includes(term);
    });
  }, [libraryBooks, search]);

  async function handleAdd(draft) {
    setActionError(null);
    try {
      await addBook(draft);
      setShowForm(false);
    } catch (err) {
      setActionError(err);
    }
  }

  async function handleDelete(book) {
    setActionError(null);
    try {
      await removeBook(book.id);
    } catch (err) {
      setActionError(err);
    }
  }

  async function handleSignOut() {
    setActionError(null);
    try {
      await onSignOut();
    } catch (err) {
      setActionError(err);
    }
  }

  // A book can only be deleted by the user who added it. This mirrors the
  // Row Level Security policy on the server, which is what actually enforces it.
  function canDelete(book) {
    return book.ownerId === user?.id;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-4xl font-bold text-blue-600">Gutenberg Books</h1>

        {user && (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-gray-700">
              Signed in as {user.email}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Sign out
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col items-start gap-3">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by title or author"
          aria-label="Search books"
          className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500"
        />

        <button
          type="button"
          onClick={() => setShowForm((visible) => !visible)}
          aria-expanded={showForm}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "Add book"}
        </button>
      </div>

      {showForm && <AddBookForm onAdd={handleAdd} />}

      {loading && (
        <p className="mt-4 text-gray-600" role="status">
          Loading books…
        </p>
      )}

      {error && (
        <p className="mt-4 text-red-600" role="alert">
          Could not load books. Please try again later.
        </p>
      )}

      {actionError && (
        <p className="mt-4 text-red-600" role="alert">
          Something went wrong: {actionError.message}
        </p>
      )}

      {!loading && !error && (
        <>
          <p className="mt-4 text-gray-600">
            Number of books: {books.length}
          </p>

          {books.length === 0 ? (
            <p className="mt-8 text-gray-500">No books found.</p>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {books.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onDelete={canDelete(book) ? handleDelete : undefined}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Library;
