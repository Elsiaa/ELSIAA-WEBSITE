/**
 * Supabase clients.
 *
 * - Browser / publishable: RLS applies (anon or authenticated JWT).
 * - User-scoped (access token): RLS applies — super_admin sees all via policies.
 * - Service / SECRET key: bypasses RLS — ONLY for scoped mail API after emk_ auth,
 *   webhooks/cron, and rare bootstrap. Never use for day-to-day admin UI (unlike Poel).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { portalEnv } from "./env";

let browserClient: SupabaseClient | null | undefined;

export function supabasePublishableConfigured(): boolean {
  const { supabaseUrl, supabaseAnonKey } = portalEnv();
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function supabaseSecretConfigured(): boolean {
  const { supabaseUrl, supabaseServiceRoleKey } = portalEnv();
  return Boolean(supabaseUrl && supabaseServiceRoleKey);
}

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (browserClient !== undefined) return browserClient;
  const { supabaseUrl, supabaseAnonKey } = portalEnv();
  if (!supabaseUrl || !supabaseAnonKey) {
    browserClient = null;
    return browserClient;
  }
  browserClient = createClient(supabaseUrl, supabaseAnonKey);
  return browserClient;
}

/** Publishable key, no session — for signInWithPassword on the server. */
export function getSupabaseAuthClient(): SupabaseClient | null {
  const { supabaseUrl, supabaseAnonKey } = portalEnv();
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** User JWT — RLS enforced (super_admin policies grant full access). */
export function getSupabaseUserClient(accessToken: string): SupabaseClient | null {
  const { supabaseUrl, supabaseAnonKey } = portalEnv();
  if (!supabaseUrl || !supabaseAnonKey || !accessToken) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Service role — BYPASSES RLS.
 * Allowed:
 * - scoped `/api/mail/v1/*` after emk_ verification
 * - Auth Admin API (create/delete users) after requireSuperAdmin()
 * - webhooks / cron
 * Forbidden: day-to-day table CRUD that a super_admin JWT can do under RLS.
 */
export function getSupabaseServiceClient(): SupabaseClient | null {
  const { supabaseUrl, supabaseServiceRoleKey } = portalEnv();
  if (!supabaseUrl || !supabaseServiceRoleKey) return null;
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function userHasSuperAdminClaim(
  appMetadata: Record<string, unknown> | null | undefined,
): boolean {
  return appMetadata?.role === "super_admin";
}
