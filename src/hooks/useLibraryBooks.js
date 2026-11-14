import { useCallback, useEffect, useState } from "react";
import {
  addLibraryBook,
  deleteLibraryBook,
  listLibraryBooks,
} from "../api/library";

/**
 * Loads the shared library (Supabase) and exposes add/remove operations.
 * State is only updated from async callbacks, never synchronously in the effect.
 */
export function useLibraryBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    listLibraryBooks()
      .then((data) => {
        if (active) setBooks(data);
      })
      .catch((err) => {
        if (active) setError(err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const addBook = useCallback(async (draft) => {
    const book = await addLibraryBook(draft);
    setBooks((prev) => [book, ...prev]);
    return book;
  }, []);

  const removeBook = useCallback(async (id) => {
    await deleteLibraryBook(id);
    setBooks((prev) => prev.filter((book) => book.id !== id));
  }, []);

  return { books, loading, error, addBook, removeBook };
}
