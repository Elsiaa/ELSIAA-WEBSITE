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
  // Prefer live runtime env (Vercel/Bun). Do not go through portalEnv()'s
  // process.env shim — Vite replaces `process.env` with `{}` in client graphs,
  // and the same helper is shared with browser code.
  const supabaseUrl = (
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    portalEnv().supabaseUrl ||
    ""
  ).trim();
  const supabaseServiceRoleKey = (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    portalEnv().supabaseServiceRoleKey ||
    ""
  ).trim();
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
  const { supabaseUrl: url, supabaseAnonKey: anon } = portalEnv();
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
