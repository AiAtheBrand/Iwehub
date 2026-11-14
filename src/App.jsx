import { useMemo, useState } from "react";
import BookCard from "./components/BookCard";
import AddBookForm from "./components/AddBookForm";
import { useBooks } from "./hooks/useBooks";

function App() {
  const { books: fetchedBooks, loading, error } = useBooks();
  const [addedBooks, setAddedBooks] = useState([]);
  const [deletedIds, setDeletedIds] = useState([]);
  const [search, setSearch] = useState("");

  // Combine the fetched catalog with locally added books, drop deleted ones,
  // and apply the search term (title or first author).
  const books = useMemo(() => {
    const term = search.trim().toLowerCase();

    return [...addedBooks, ...fetchedBooks].filter((book) => {
      if (deletedIds.includes(book.id)) return false;
      if (!term) return true;

      const title = book.title?.toLowerCase() ?? "";
      const author = book.authors?.[0]?.name?.toLowerCase() ?? "";
      return title.includes(term) || author.includes(term);
    });
  }, [addedBooks, fetchedBooks, deletedIds, search]);

  function handleAdd(book) {
    setAddedBooks((prev) => [book, ...prev]);
  }

  function handleDelete(id) {
    setAddedBooks((prev) => prev.filter((book) => book.id !== id));
    setDeletedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <h1 className="text-4xl font-bold text-blue-600">Gutenberg Books</h1>

      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search by title or author"
        aria-label="Search books"
        className="mt-6 w-full max-w-md rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500"
      />

      <AddBookForm onAdd={handleAdd} />

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
                <BookCard key={book.id} book={book} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
