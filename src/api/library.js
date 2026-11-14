import {
  BOOK_FILES_BUCKET,
  COVERS_BUCKET,
  supabase,
} from "../lib/supabase";

const NOT_CONFIGURED =
  "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.";

/** Map a Supabase `books` row to the shape the UI components expect. */
function toBook(row) {
  return {
    id: row.id,
    title: row.title,
    authors: row.author ? [{ name: row.author }] : [],
    cover_image: row.cover_url ?? "",
    download_count: 0,
    source: "library",
    ownerId: row.created_by ?? null,
    fileUrl: row.file_url ?? "",
    fileName: row.file_name ?? "",
  };
}

/** Convert a base64 data URL (from the file picker) into a Blob for upload. */
function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(",");
  const type = header.match(/data:(.*?);base64/)?.[1] ?? "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type });
}

/** Lower-case extension of a filename, including the dot ("" when none). */
function extensionOf(name) {
  const match = /\.[a-z0-9]+$/i.exec(name ?? "");
  return match ? match[0].toLowerCase() : "";
}

/** Fetch every book in the shared library, newest first. */
export async function listLibraryBooks() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("books")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data.map(toBook);
}

/**
 * Add a book to the shared library.
 *
 * Two optional uploads happen first, each stored under a random name:
 * - the cover image (a base64 data URL from the picker) -> `covers` bucket
 * - the book file itself (a File) -> `book-files` bucket
 * Only their public URLs are written to the row.
 */
export async function addLibraryBook(draft) {
  if (!supabase) throw new Error(NOT_CONFIGURED);

  let coverUrl = "";

  if (draft.cover_image?.startsWith("data:")) {
    const blob = dataUrlToBlob(draft.cover_image);
    const path = crypto.randomUUID();

    const { error: uploadError } = await supabase.storage
      .from(COVERS_BUCKET)
      .upload(path, blob, { contentType: blob.type, upsert: false });

    if (uploadError) throw uploadError;

    coverUrl = supabase.storage
      .from(COVERS_BUCKET)
      .getPublicUrl(path).data.publicUrl;
  }

  let fileUrl = "";
  let fileName = "";

  if (draft.file) {
    const path = `${crypto.randomUUID()}${extensionOf(draft.file.name)}`;

    const { error: uploadError } = await supabase.storage
      .from(BOOK_FILES_BUCKET)
      .upload(path, draft.file, {
        contentType: draft.file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    fileUrl = supabase.storage
      .from(BOOK_FILES_BUCKET)
      .getPublicUrl(path).data.publicUrl;
    fileName = draft.file.name;
  }

  const { data, error } = await supabase
    .from("books")
    .insert({
      title: draft.title,
      author: draft.authors?.[0]?.name ?? null,
      cover_url: coverUrl,
      file_url: fileUrl,
      file_name: fileName,
    })
    .select()
    .single();

  if (error) throw error;
  return toBook(data);
}

/** Remove a book from the shared library. */
export async function deleteLibraryBook(id) {
  if (!supabase) throw new Error(NOT_CONFIGURED);

  const { error } = await supabase.from("books").delete().eq("id", id);
  if (error) throw error;
}
