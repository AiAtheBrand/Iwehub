// The browser never talks to RapidAPI directly. Requests go to our own
// `/api` routes, which the dev server proxies to the backend (see
// vite.config.js) and which production serves from `server/index.js`.
// The API key lives only on the server, so it is never shipped to the client.

/**
 * Perform a GET request against the local API and return the `results` array.
 * Throws if the response is not OK or if the body is not valid JSON.
 */
async function request(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Request to ${path} failed with status ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data?.results) ? data.results : [];
}

/** Fetch the first page of books. */
export function getBooks() {
  return request("/api/books");
}

/**
 * Fetch a single book by its Gutenberg id.
 * The API returns `{ results: [book] }`, so we unwrap the first entry.
 * Resolves to `null` when no book matches the id.
 */
export async function getBook(id) {
  const results = await request(`/api/books/${id}`);
  return results[0] ?? null;
}
