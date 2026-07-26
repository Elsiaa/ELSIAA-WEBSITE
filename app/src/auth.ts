/**
 * Auth session bridge for copied Poel code — single Supabase JWT cookie.
 */
import { readAppSessionWithLegacyFallback } from "./lib/app-session.server";
import { isSuperAdminEmail } from "./lib/super-admin";

export type PoelAuthSession = {
  user: {
    id: string;
    email: string;
    name?: string | null;
  };
} | null;

export async function auth(): Promise<PoelAuthSession> {
  const session = await readAppSessionWithLegacyFallback();
  if (!session?.email || !session.userId) return null;
  return {
    user: {
      id: session.userId,
      email: session.email,
      name: session.displayName,
    },
  };
}

export async function authIsSuperAdmin(): Promise<boolean> {
  const session = await readAppSessionWithLegacyFallback();
  if (!session) return false;
  return Boolean(session.isSuperAdmin && isSuperAdminEmail(session.email));
}
