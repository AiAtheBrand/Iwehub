import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getBooks, getBook } from "./books";

describe("books api", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the results array on success", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ results: [{ id: 1, title: "Book One" }] }),
    });

    await expect(getBooks()).resolves.toEqual([{ id: 1, title: "Book One" }]);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("calls the local proxy route, not RapidAPI directly", async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => ({ results: [] }) });

    await getBooks();

    const [url] = fetch.mock.calls[0];
    expect(url).toBe("/api/books");
    expect(url).not.toContain("rapidapi");
  });

  it("throws when the response is not ok", async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    await expect(getBooks()).rejects.toThrow(/500/);
  });

  it("returns an empty array when results are missing", async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => ({}) });

    await expect(getBooks()).resolves.toEqual([]);
  });

  it("getBook unwraps the first result", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ results: [{ id: 1342 }] }),
    });

    await expect(getBook(1342)).resolves.toEqual({ id: 1342 });
    expect(fetch.mock.calls[0][0]).toBe("/api/books/1342");
  });

  it("getBook resolves to null when no book matches", async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => ({ results: [] }) });

    await expect(getBook(999)).resolves.toBeNull();
  });
});
