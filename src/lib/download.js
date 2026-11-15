/**
 * The single download for a shared-library book: the file the user uploaded.
 *
 * Supabase Storage honours `?download=<name>` by sending the file as an
 * attachment with that filename instead of displaying it inline, so the
 * original name is preserved on the user's disk.
 *
 * Returns null when the book has no uploaded file.
 */
export function getDownload(book) {
  const fileUrl = book?.fileUrl;
  if (!fileUrl) return null;

  const name = book?.fileName || "";

  return {
    label: "Download",
    url: name ? `${fileUrl}?download=${encodeURIComponent(name)}` : fileUrl,
  };
}
