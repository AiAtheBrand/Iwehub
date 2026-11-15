import { describe, it, expect } from "vitest";
import { getDownload } from "./download";

describe("getDownload", () => {
  it("returns the uploaded file with a download filename", () => {
    expect(
      getDownload({
        fileUrl: "https://example.com/storage/book-files/abc.epub",
        fileName: "My Book.epub",
      }),
    ).toEqual({
      label: "Download",
      url: "https://example.com/storage/book-files/abc.epub?download=My%20Book.epub",
    });
  });

  it("omits the download query when the file has no name", () => {
    expect(
      getDownload({ fileUrl: "https://example.com/abc.epub" }),
    ).toEqual({
      label: "Download",
      url: "https://example.com/abc.epub",
    });
  });

  it("returns null when the book has no uploaded file", () => {
    expect(getDownload({})).toBeNull();
    expect(getDownload({ fileUrl: "" })).toBeNull();
    expect(getDownload(undefined)).toBeNull();
  });
});
