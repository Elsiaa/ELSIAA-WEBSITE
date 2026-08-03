/**
 * Server-only env reads via Node's real `process`.
 * Shared modules that touch `process.env` get Vite's empty `{}` shim in the
 * client bundle — secrets must never go through that path.
 */
import process from "node:process";

function trim(v: string | undefined | null): string | undefined {
  const t = v?.trim();
  return t || undefined;
}

function read(...names: string[]): string | undefined {
  for (const name of names) {
    const v = trim(process.env[name]);
    if (v) return v;
  }
  return undefined;
}

export function serverPortalEnv() {
  return {
    authSecret: read("AUTH_SECRET"),
    adminKey: read("ADMIN_KEY"),
    superAdminEmails: (read("SUPER_ADMIN_EMAILS") ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
    supabaseUrl: read("SUPABASE_URL", "VITE_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"),
    supabaseAnonKey: read(
      "SUPABASE_PUBLISHABLE_KEY",
      "SUPABASE_ANON_KEY",
      "VITE_SUPABASE_PUBLISHABLE_KEY",
      "VITE_SUPABASE_ANON_KEY",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ),
    supabaseServiceRoleKey: read("SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"),
    supabaseJwksUrl: read("SUPABASE_JWKS_URL"),
  };
}
