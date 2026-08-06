/**
 * Super-admin allowlist — from SUPER_ADMIN_EMAILS env (UI / sign-in gate).
 * RLS super-admin access is JWT app_metadata.role = 'super_admin' (see SQL bootstrap).
 * Both are required for /admin: env allowlist + Supabase claim.
 */

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function parseSuperAdminEmails(): string[] {
  const raw = (typeof process !== "undefined" ? process.env.SUPER_ADMIN_EMAILS : undefined) ?? "";
  return raw.split(",").map(normalizeEmail).filter(Boolean);
}

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const n = normalizeEmail(email);
  return parseSuperAdminEmails().includes(n);
}

export function superAdminConfigured(): boolean {
  return parseSuperAdminEmails().length > 0;
}
