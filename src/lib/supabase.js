/**
 * Supabase client initialisation.
 *
 * Required environment variables (add to .env and Vercel dashboard):
 *   VITE_SUPABASE_URL      – Project URL from Supabase → Settings → API
 *   VITE_SUPABASE_ANON_KEY – Publishable "anon" key (safe for browsers)
 *
 * NEVER put the service-role key in browser code.
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
        // We handle auth ourselves via Google OAuth tokens (JWT from Google Identity
        // Services) rather than Supabase's built-in auth flow.
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;
