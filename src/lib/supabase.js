import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * True when Supabase credentials are present.
 *
 * Unlike the RapidAPI key, the Supabase *anon* key is safe to expose to the
 * browser: Row Level Security (RLS) enforces who can read/write on the server.
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null;

export const COVERS_BUCKET = "covers";
