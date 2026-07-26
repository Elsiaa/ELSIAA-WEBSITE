/**
 * Poel-compatible Supabase clients — wired to ELSIAA env names.
 * getServerSupabaseClient uses the secret key (same as Poel service role)
 * only after API handlers have already called requireAuth / requireSuperAdmin.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { portalEnv } from "./portal/env";

function urlAndAnon() {
  const { supabaseUrl, supabaseAnonKey } = portalEnv();
  return { url: supabaseUrl, anon: supabaseAnonKey };
}

export function getServerSupabaseClient(): SupabaseClient {
  const { supabaseUrl, supabaseServiceRoleKey } = portalEnv();
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SECRET_KEY (service client)",
    );
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function getClientSupabaseClient(): SupabaseClient {
  const env = portalEnv();
  const url =
    env.supabaseUrl ||
    (typeof import.meta !== "undefined"
      ? (import.meta.env.VITE_SUPABASE_URL as string | undefined)
      : undefined) ||
    (typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL
      : undefined);
  const anon =
    env.supabaseAnonKey ||
    (typeof import.meta !== "undefined"
      ? (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
        (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)
      : undefined) ||
    (typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.VITE_SUPABASE_PUBLISHABLE_KEY
      : undefined);
  if (!url || !anon) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY");
  }
  return createClient(url, anon);
}

const { url: _u, anon: _a } = urlAndAnon();
export const supabase =
  _u && _a
    ? createClient(_u, _a)
    : (null as unknown as SupabaseClient);
