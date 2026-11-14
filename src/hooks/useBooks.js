import { useEffect, useState } from "react";
import { getBooks } from "../api/books";

/**
 * Loads the list of books on mount and exposes loading/error state.
 * State is only updated from async callbacks (never synchronously in the
 * effect body), which avoids cascading renders.
 * The `active` flag prevents state updates after the component unmounts.
 */
export function useBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    getBooks()
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

  return { books, loading, error };
}
