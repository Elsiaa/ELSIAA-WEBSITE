/**
 * User invitation system
 * Sends invitation emails to new users
 */

/**
 * Generate an invitation token (you can use JWT or a simple UUID)
 */
export function generateInvitationToken(
  email: string,
  companyId: string,
  options?: { superAdmin?: boolean },
): string {
  // For now, use a simple base64 encoded JSON
  // In production, use a signed JWT with expiration
  const payload = {
    email,
    companyId,
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    ...(options?.superAdmin ? { superAdmin: true } : {}),
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

/**
 * Verify an invitation token
 */
export function verifyInvitationToken(
  token: string,
): { email: string; companyId: string; superAdmin?: boolean } | null {
  try {
    const payload = JSON.parse(Buffer.from(token, "base64").toString());
    if (payload.expires < Date.now()) {
      return null; // Token expired
    }
    return {
      email: payload.email,
      companyId: payload.companyId,
      ...(payload.superAdmin ? { superAdmin: true as const } : {}),
    };
  } catch {
    return null;
  }
}
