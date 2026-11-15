import { describe, it, expect, vi, beforeEach } from "vitest";

const { from, storageFrom } = vi.hoisted(() => ({
  from: vi.fn(),
  storageFrom: vi.fn(),
}));

vi.mock("../lib/supabase", () => ({
  COVERS_BUCKET: "covers",
  BOOK_FILES_BUCKET: "book-files",
  supabase: {
    from,
    storage: { from: storageFrom },
  },
}));

import { addLibraryBook, deleteLibraryBook } from "./library";
import { MAX_UPLOAD_BYTES } from "../lib/limits";

const PUBLIC = "https://project.supabase.co/storage/v1/object/public";

/** Make `from("books")` resolve the given row on read and succeed on delete. */
function mockBooks(row) {
  from.mockImplementation(() => ({
    select: () => ({
      eq: () => ({ maybeSingle: () => Promise.resolve({ data: row, error: null }) }),
    }),
    delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
  }));
}

function mockRemove() {
  const remove = vi.fn().mockResolvedValue({ data: [], error: null });
  storageFrom.mockReturnValue({ remove });
  return remove;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("addLibraryBook", () => {
  it("rejects a book file over the upload limit before uploading", async () => {
    const file = new File(["x"], "big.epub", { type: "application/epub+zip" });
    Object.defineProperty(file, "size", { value: MAX_UPLOAD_BYTES + 1 });

    await expect(addLibraryBook({ title: "Big", file })).rejects.toThrow(
      /20 MB/,
    );
    expect(storageFrom).not.toHaveBeenCalled();
  });
});

describe("deleteLibraryBook", () => {
  it("deletes the row and removes its cover and book file", async () => {
    const remove = mockRemove();
    mockBooks({
      cover_url: `${PUBLIC}/covers/cover-abc`,
      file_url: `${PUBLIC}/book-files/file-xyz.epub`,
    });

    await deleteLibraryBook("book-1");

    expect(from).toHaveBeenCalledWith("books");
    expect(storageFrom.mock.calls.map((call) => call[0])).toEqual([
      "covers",
      "book-files",
    ]);

    const removedPaths = remove.mock.calls.map((call) => call[0][0]);
    expect(removedPaths).toContain("cover-abc");
    expect(removedPaths).toContain("file-xyz.epub");
  });

  it("does not touch storage when the row has no files", async () => {
    const remove = mockRemove();
    mockBooks({ cover_url: null, file_url: null });

    await deleteLibraryBook("book-2");

    expect(remove).not.toHaveBeenCalled();
  });

  it("ignores files that belong to a different bucket", async () => {
    const remove = mockRemove();
    mockBooks({
      cover_url: "https://example.com/somewhere-else.png",
      file_url: "",
    });

    await deleteLibraryBook("book-3");

    expect(remove).not.toHaveBeenCalled();
  });
});
