import { describe, it, expect } from "vitest";
import { getDownloadOptions, getPreferredDownload } from "./formats";

const formats = {
  "text/plain; charset=us-ascii": "https://example.com/1342-0.txt",
  "text/plain": "https://example.com/1342.txt",
  "text/html; charset=utf-8": "https://example.com/1342-h.html",
  "text/html": "https://example.com/1342.html.images",
  "application/epub+zip": "https://example.com/1342.epub3.images",
  "application/x-mobipocket-ebook": "https://example.com/1342.kf8.images",
  "text/plain; charset=utf-8": "https://example.com/1342.txt.utf-8",
  "application/rdf+xml": "https://example.com/1342.rdf",
  "image/jpeg": "https://example.com/1342.cover.jpg",
  "application/zip": "https://example.com/1342-h.zip",
  "application/octet-stream": "https://example.com/1342-h.zip",
};

describe("getDownloadOptions", () => {
  it("returns book formats in preference order", () => {
    const options = getDownloadOptions({ formats });

    expect(options.map((option) => option.label)).toEqual([
      "EPUB",
      "Kindle",
      "Plain text",
      "HTML",
      "HTML (zip)",
    ]);
  });

  it("prefers the EPUB url", () => {
    const options = getDownloadOptions({ formats });

    expect(options[0]).toEqual({
      label: "EPUB",
      url: "https://example.com/1342.epub3.images",
    });
  });

  it("drops metadata and cover images", () => {
    const options = getDownloadOptions({ formats });
    const labels = options.map((option) => option.label);

    expect(labels).not.toContain("RDF");
    expect(options.some((option) => option.url.endsWith(".rdf"))).toBe(false);
    expect(options.some((option) => option.url.endsWith(".jpg"))).toBe(false);
  });

  it("keeps only the best-ranked variant of a duplicated label", () => {
    const options = getDownloadOptions({ formats });
    const plainText = options.filter((option) => option.label === "Plain text");

    expect(plainText).toHaveLength(1);
    expect(plainText[0].url).toBe("https://example.com/1342.txt.utf-8");
  });

  it("returns an empty array when there are no formats", () => {
    expect(getDownloadOptions({})).toEqual([]);
    expect(getDownloadOptions({ formats: null })).toEqual([]);
    expect(getDownloadOptions(undefined)).toEqual([]);
  });
});

describe("getPreferredDownload", () => {
  it("returns the best option", () => {
    expect(getPreferredDownload({ formats })).toEqual({
      label: "EPUB",
      url: "https://example.com/1342.epub3.images",
    });
  });

  it("falls back to plain text when there is no EPUB", () => {
    const onlyText = { "text/plain; charset=utf-8": "https://example.com/a.txt" };

    expect(getPreferredDownload({ formats: onlyText })).toEqual({
      label: "Plain text",
      url: "https://example.com/a.txt",
    });
  });

  it("returns null when nothing is downloadable", () => {
    expect(getPreferredDownload({})).toBeNull();
    expect(getPreferredDownload(undefined)).toBeNull();
  });

  it("returns the uploaded file for a shared-library book", () => {
    expect(
      getPreferredDownload({
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
      getPreferredDownload({ fileUrl: "https://example.com/abc.epub" }),
    ).toEqual({
      label: "Download",
      url: "https://example.com/abc.epub",
    });
  });

  it("prefers Gutenberg formats over an uploaded file", () => {
    expect(
      getPreferredDownload({ formats, fileUrl: "https://example.com/abc.epub" }),
    ).toEqual({
      label: "EPUB",
      url: "https://example.com/1342.epub3.images",
    });
  });
});
