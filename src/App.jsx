import { useMemo, useState } from "react";
import BookCard from "./components/BookCard";
import AddBookForm from "./components/AddBookForm";
import AuthForm from "./components/AuthForm";
import { useAuth } from "./hooks/useAuth";
import { useBooks } from "./hooks/useBooks";
import { useLibraryBooks } from "./hooks/useLibraryBooks";
import { useLocalStorage } from "./hooks/useLocalStorage";

function App() {
  const {
    books: catalogBooks,
    loading: catalogLoading,
    error: catalogError,
  } = useBooks();
  const {
    books: libraryBooks,
    loading: libraryLoading,
    error: libraryError,
    addBook,
    removeBook,
  } = useLibraryBooks();
  const {
    user,
    loading: authLoading,
    configured: authConfigured,
    signIn,
    signUp,
    signOut,
  } = useAuth();

  // Only Gutenberg-catalogue deletions are stored locally; shared library
  // books are deleted from the database for everyone.
  const [deletedIds, setDeletedIds] = useLocalStorage(
    "gutenberg:deletedIds",
    [],
  );
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [actionError, setActionError] = useState(null);

  const loading = catalogLoading || libraryLoading;
  const error = catalogError || libraryError;

  // Merge the shared library with the Gutenberg catalogue, hide deleted
  // catalogue books, and apply the search term (title or first author).
  const books = useMemo(() => {
    const term = search.trim().toLowerCase();
    const catalog = catalogBooks.map((book) => ({
      ...book,
      source: "gutenberg",
    }));

    return [...libraryBooks, ...catalog].filter((book) => {
      if (book.source === "gutenberg" && deletedIds.includes(book.id)) {
        return false;
      }
      if (!term) return true;

      const title = book.title?.toLowerCase() ?? "";
      const author = book.authors?.[0]?.name?.toLowerCase() ?? "";
      return title.includes(term) || author.includes(term);
    });
  }, [libraryBooks, catalogBooks, deletedIds, search]);

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
      if (book.source === "library") {
        await removeBook(book.id);
      } else {
        setDeletedIds((prev) =>
          prev.includes(book.id) ? prev : [...prev, book.id],
        );
      }
    } catch (err) {
      setActionError(err);
    }
  }

  async function handleSignOut() {
    setActionError(null);
    try {
      await signOut();
    } catch (err) {
      setActionError(err);
    }
  }

  // A book can be deleted when the visitor is signed in AND either it is a
  // local catalogue entry (hidden just for them) or they own the library row.
  function canDelete(book) {
    if (!user) return false;
    if (book.source === "gutenberg") return true;
    return book.ownerId === user.id;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <h1 className="text-4xl font-bold text-blue-600">Gutenberg Books</h1>

      {authConfigured && !authLoading && (
        <div className="mt-4">
          {user ? (
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
          ) : (
            <AuthForm onSignIn={signIn} onSignUp={signUp} />
          )}
        </div>
      )}

      <div className="mt-6 flex flex-col items-start gap-3">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by title or author"
          aria-label="Search books"
          className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500"
        />

        {user && (
          <button
            type="button"
            onClick={() => setShowForm((visible) => !visible)}
            aria-expanded={showForm}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            {showForm ? "Cancel" : "Add book"}
          </button>
        )}
      </div>

      {user && showForm && <AddBookForm onAdd={handleAdd} />}

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

export default App;
