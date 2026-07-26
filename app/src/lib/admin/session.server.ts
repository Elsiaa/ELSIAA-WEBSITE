/**
 * Admin session API — aliases of the single app session.
 * Super-admin checks use isSuperAdmin on the shared Supabase JWT cookie.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SessionConfig } from "@tanstack/react-start/server";
import {
  appSessionConfig,
  destroyAppSession,
  jwtSubFromToken,
  readAppSessionWithLegacyFallback,
  requireSuperAdminSession,
  requireSuperAdminSupabaseSession,
  writeAppSession,
  type AppSessionData,
} from "../app-session.server";
import { isSuperAdminEmail } from "./super-admin";

export type AdminSessionData = {
  email: string;
  role: "super_admin";
  accessToken: string;
  refreshToken: string;
};

function toAdmin(session: AppSessionData): AdminSessionData | null {
  if (!session.isSuperAdmin || !isSuperAdminEmail(session.email)) return null;
  return {
    email: session.email,
    role: "super_admin",
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
  };
}

export function adminSessionConfig(): SessionConfig | null {
  return appSessionConfig();
}

export async function readAdminSession(): Promise<AdminSessionData | null> {
  const session = await readAppSessionWithLegacyFallback();
  if (!session) return null;
  return toAdmin(session);
}

export async function writeAdminSession(input: {
  email: string;
  accessToken: string;
  refreshToken: string;
  userId?: string;
  displayName?: string;
}): Promise<void> {
  if (!isSuperAdminEmail(input.email)) throw new Error("Not a super admin");
  const email = input.email.trim().toLowerCase();
  const userId =
    input.userId ||
    jwtSubFromToken(input.accessToken) ||
    email;
  await writeAppSession({
    email,
    userId,
    accessToken: input.accessToken,
    refreshToken: input.refreshToken,
    displayName: input.displayName || email.split("@")[0] || email,
    isSuperAdmin: true,
  });
}

export async function destroyAdminSession(): Promise<void> {
  return destroyAppSession();
}

export async function requireSuperAdmin(): Promise<AdminSessionData> {
  const session = await requireSuperAdminSession();
  const admin = toAdmin(session);
  if (!admin) throw new Error("Unauthorized");
  return admin;
}

export async function requireSuperAdminSupabase(): Promise<{
  session: AdminSessionData;
  client: SupabaseClient;
}> {
  const { session, client } = await requireSuperAdminSupabaseSession();
  const admin = toAdmin(session);
  if (!admin) throw new Error("Unauthorized");
  return { session: admin, client };
}
