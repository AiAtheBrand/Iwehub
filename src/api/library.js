import {
  BOOK_FILES_BUCKET,
  COVERS_BUCKET,
  supabase,
} from "../lib/supabase";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "../lib/limits";

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
    ownerId: row.created_by ?? null,
    fileUrl: row.file_url ?? "",
    fileName: row.file_name ?? "",
    summary: row.summary ?? "",
    subjects: Array.isArray(row.subjects) ? row.subjects : [],
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

/**
 * Recover a Storage object path from its public URL, e.g.
 *   ".../storage/v1/object/public/covers/abc" -> "abc"
 * Returns null when the URL is missing or belongs to a different bucket.
 */
function storagePathFromPublicUrl(bucket, publicUrl) {
  if (!publicUrl) return null;

  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) return null;

  const path = publicUrl.slice(index + marker.length).split("?")[0];
  return path ? decodeURIComponent(path) : null;
}

/**
 * Delete one Storage object, deriving its path from its public URL.
 *
 * Best effort: called after the database row is already gone, so a failure
 * here (for example a missing DELETE policy) must not surface as a failed
 * delete. The row is what the user sees.
 */
async function removeStorageObject(bucket, publicUrl) {
  const path = storagePathFromPublicUrl(bucket, publicUrl);
  if (!path) return;

  await supabase.storage.from(bucket).remove([path]);
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

/** Fetch a single shared-library book by id, or null when it does not exist. */
export async function getLibraryBook(id) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? toBook(data) : null;
}

/**
 * Add a book to the shared library.
 *
 * Two optional uploads happen first, each stored under a random name:
 * - the cover image (a base64 data URL from the picker) -> `covers` bucket
 * - the book file itself (a File) -> `book-files` bucket
 * Only their public URLs are written to the row.
 *
 * Files over MAX_UPLOAD_BYTES are rejected here as well as in the form, so the
 * limit holds even if this function is called directly.
 */
export async function addLibraryBook(draft) {
  if (!supabase) throw new Error(NOT_CONFIGURED);

  let coverUrl = "";

  if (draft.cover_image?.startsWith("data:")) {
    const blob = dataUrlToBlob(draft.cover_image);

    if (blob.size > MAX_UPLOAD_BYTES) {
      throw new Error(`Cover image must be ${MAX_UPLOAD_LABEL} or smaller.`);
    }

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
    if (draft.file.size > MAX_UPLOAD_BYTES) {
      throw new Error(`Book file must be ${MAX_UPLOAD_LABEL} or smaller.`);
    }

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
      summary: draft.summary?.trim() ? draft.summary.trim() : null,
      subjects: draft.subjects ?? [],
    })
    .select()
    .single();

  if (error) throw error;
  return toBook(data);
}

/**
 * Remove a book from the shared library, including its uploaded files.
 *
 * The row is read first so the cover and book file can be cleaned up from
 * Storage afterwards. Deleting only the row would leave those objects behind
 * as orphans: still stored, still publicly reachable, but no longer referenced
 * by anything in the app.
 */
export async function deleteLibraryBook(id) {
  if (!supabase) throw new Error(NOT_CONFIGURED);

  const { data: row, error: readError } = await supabase
    .from("books")
    .select("cover_url, file_url")
    .eq("id", id)
    .maybeSingle();

  if (readError) throw readError;

  const { error } = await supabase.from("books").delete().eq("id", id);
  if (error) throw error;

  await Promise.all([
    removeStorageObject(COVERS_BUCKET, row?.cover_url),
    removeStorageObject(BOOK_FILES_BUCKET, row?.file_url),
  ]);
}
