import BookCard from "./components/BookCard";
import { useBooks } from "./hooks/useBooks";

function App() {
  const { books, loading, error } = useBooks();

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <h1 className="text-4xl font-bold text-blue-600">Gutenberg Books</h1>

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
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
