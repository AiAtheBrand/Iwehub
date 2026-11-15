import { useEffect, useState } from "react";
import { getLibraryBook } from "../api/library";

/**
 * Loads a single shared-library book by id. Re-runs when the id changes.
 *
 * Mirrors `useBook`: the resolved id is stored with the result so a previous
 * book is ignored during render instead of being reset with a synchronous
 * setState inside the effect.
 */
export function useLibraryBook(id) {
  const [result, setResult] = useState({
    id,
    book: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let active = true;

    getLibraryBook(id)
      .then((data) => {
        if (active) {
          setResult({ id, book: data, loading: false, error: null });
        }
      })
      .catch((err) => {
        if (active) {
          setResult({ id, book: null, loading: false, error: err });
        }
      });

    return () => {
      active = false;
    };
  }, [id]);

  // A result is only current when it was fetched for the requested id.
  const isCurrent = result.id === id;

  return {
    book: isCurrent ? result.book : null,
    loading: !isCurrent || result.loading,
    error: isCurrent ? result.error : null,
  };
}
