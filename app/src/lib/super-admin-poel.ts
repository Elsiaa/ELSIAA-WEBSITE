import { normalizeEmailForAuth } from '@/lib/email-normalize';

/**
 * Super-admin allowlist from environment (replaces Clerk publicMetadata.role === 'superuser').
 */
export function parseSuperAdminEmails(): Set<string> {
  const raw = process.env.SUPER_ADMIN_EMAILS || '';
  const set = new Set<string>();
  for (const part of raw.split(',')) {
    const e = normalizeEmailForAuth(part);
    if (e) set.add(e);
  }
  return set;
}

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  const n = normalizeEmailForAuth(email ?? '');
  if (!n) return false;
  return parseSuperAdminEmails().has(n);
}
