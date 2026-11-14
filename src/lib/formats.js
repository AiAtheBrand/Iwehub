// The Gutenberg API returns a `formats` object keyed by MIME type, e.g.
//   { "application/epub+zip": "https://.../1342.epub3.images",
//     "text/plain; charset=utf-8": "https://.../1342.txt.utf-8" }
// This module turns that map into an ordered list of human-readable download
// options. Metadata (RDF) and the cover image are intentionally excluded.

const FORMAT_LABELS = {
  "application/epub+zip": "EPUB",
  "application/x-mobipocket-ebook": "Kindle",
  "text/plain; charset=utf-8": "Plain text",
  "text/plain": "Plain text",
  "text/html; charset=utf-8": "HTML",
  "text/html": "HTML",
  "application/zip": "HTML (zip)",
  "application/octet-stream": "HTML (zip)",
};

// Best first: EPUB reads well everywhere, Kindle for e-readers, then text.
const PREFERRED_ORDER = [
  "application/epub+zip",
  "application/x-mobipocket-ebook",
  "text/plain; charset=utf-8",
  "text/plain",
  "text/html; charset=utf-8",
  "text/html",
  "application/zip",
  "application/octet-stream",
];

/**
 * Ordered download options for a book, e.g.
 *   [{ label: "EPUB", url: "https://..." }, { label: "Plain text", url: "..." }]
 * Returns an empty array when the book has no downloadable formats (for
 * example, books users added to the shared library).
 */
export function getDownloadOptions(book) {
  const formats = book?.formats;
  if (!formats || typeof formats !== "object") return [];

  const options = [];
  const seen = new Set();

  for (const mime of PREFERRED_ORDER) {
    const url = formats[mime];
    if (!url) continue;

    const label = FORMAT_LABELS[mime];
    // Two MIME types can map to one label (e.g. plain text with/without the
    // charset); keep only the best-ranked one.
    if (seen.has(label)) continue;
    seen.add(label);

    options.push({ label, url });
  }

  return options;
}

/**
 * The single best download for a book, from either source:
 * - Gutenberg catalogue books: the best entry in `book.formats`
 * - Shared-library books: the file the user uploaded (`book.fileUrl`)
 * Returns null when there is nothing to download.
 */
export function getPreferredDownload(book) {
  const fromFormats = getDownloadOptions(book)[0];
  if (fromFormats) return fromFormats;

  const fileUrl = book?.fileUrl;
  if (fileUrl) {
    const name = book.fileName || "";
    // Supabase Storage honours `?download=<name>` by sending the file as an
    // attachment with that filename instead of displaying it inline.
    return {
      label: "Download",
      url: name ? `${fileUrl}?download=${encodeURIComponent(name)}` : fileUrl,
    };
  }

  return null;
}
