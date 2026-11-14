import { useEffect, useState } from "react";

/**
 * State that is kept in sync with window.localStorage under `key`.
 * Falls back to `initialValue` when storage is empty or unavailable
 * (e.g. private browsing or a full quota).
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored === null ? initialValue : JSON.parse(stored);
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage can be full or blocked; the app still works in memory.
    }
  }, [key, value]);

  return [value, setValue];
}
