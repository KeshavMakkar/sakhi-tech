/**
 * Supabase client initialisation.
 *
 * Configured with session persistence and auto token refresh so that
 * Supabase Auth sessions (from Google ID token exchange) remain active
 * across page reloads and tab navigations.
 *
 * Required environment variables:
 *   VITE_SUPABASE_URL      – Project URL from Supabase → Settings → API
 *   VITE_SUPABASE_ANON_KEY – Publishable "anon" key (safe for browsers)
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured =
  Boolean(supabaseUrl) &&
  supabaseUrl.startsWith('https://') &&
  Boolean(supabaseAnonKey);

/** Singleton client – null when env vars are missing. */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
