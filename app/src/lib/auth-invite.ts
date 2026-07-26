import { isSuperAdminEmail } from '@/lib/super-admin';
import { normalizeEmailForAuth } from '@/lib/email-normalize';
import { getUserByEmailNormalized } from '@/lib/users';

function notInvitedUrl(): string {
  const base =
    process.env.AUTH_URL || process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return `${base.replace(/\/$/, '')}/sign-in/not-invited`;
}

/**
 * Invite-only gate. Returns true if sign-in may proceed, or an absolute URL to redirect (not invited).
 */
export async function runInviteGate(
  email: string | null | undefined,
  options?: { isOAuth?: boolean; emailVerified?: boolean }
): Promise<true | string> {
  if (!email) return notInvitedUrl();
  const normalized = normalizeEmailForAuth(email);
  if (!normalized) return notInvitedUrl();
  if (isSuperAdminEmail(normalized)) return true;
  if (options?.isOAuth && options.emailVerified === false) return notInvitedUrl();

  const appUser = await getUserByEmailNormalized(normalized);
  if (!appUser) return notInvitedUrl();
  if (appUser.status === 'inactive') return notInvitedUrl();
  return true;
}
