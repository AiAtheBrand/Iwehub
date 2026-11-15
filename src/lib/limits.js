/**
 * Shared upload limits.
 *
 * Supabase's free tier caps a *single* upload at 50 MB and gives 1 GB of
 * storage in total. We enforce a lower limit of our own so that one large book
 * cannot dominate the quota, and so users get instant feedback in the form
 * instead of a failed request.
 *
 * Both the form (for immediate validation) and the API layer (as a last line of
 * defence) read these values, so the limit is defined in exactly one place.
 */
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 MB

/** The limit as text, for messages shown to users. */
export const MAX_UPLOAD_LABEL = "20 MB";
