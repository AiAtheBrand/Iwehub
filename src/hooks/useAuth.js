import { useCallback, useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

const NOT_CONFIGURED =
  "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.";

/**
 * Tracks the Supabase auth session and exposes sign up / in / out helpers.
 * The session is loaded once on mount and kept in sync via
 * `onAuthStateChange` (async callbacks only, so no setState-in-effect).
 */
export function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) return undefined;

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (active) setSession(nextSession ?? null);
      },
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (email, password) => {
    if (!supabase) throw new Error(NOT_CONFIGURED);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }, []);

  const signIn = useCallback(async (email, password) => {
    if (!supabase) throw new Error(NOT_CONFIGURED);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  return {
    user: session?.user ?? null,
    loading,
    configured: isSupabaseConfigured,
    signUp,
    signIn,
    signOut,
  };
}
