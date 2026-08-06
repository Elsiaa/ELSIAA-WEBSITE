/**
 * Single ELSIAA app session — one sealed cookie holding Supabase Auth tokens.
 * Portal and admin both use this; authorization (super admin / company admin)
 * is derived from JWT claims + DB, not a second cookie.
 */
import {
  clearSession,
  getSession,
  useSession,
  type SessionConfig,
} from "@tanstack/react-start/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isSuperAdminEmail } from "./admin/super-admin";
import { portalEnv } from "./portal/env";
import {
  getSupabaseAuthClient,
  getSupabaseUserClient,
  supabasePublishableConfigured,
  userHasSuperAdminClaim,
} from "./portal/supabase";

export type AppSessionData = {
  email: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  displayName: string;
  isSuperAdmin: boolean;
};

const COOKIE = "elsiaa_session";
/** Cleared on destroy so old dual-cookie logins cannot linger. */
const LEGACY_COOKIES = ["elsiaa_portal", "elsiaa_admin"] as const;

function sessionPassword(): string | null {
  const secret = portalEnv().authSecret || portalEnv().adminKey;
  if (!secret) return null;
  return secret.length >= 32 ? secret : secret.padEnd(32, "*");
}

export function appSessionConfig(): SessionConfig | null {
  const password = sessionPassword();
  if (!password) return null;
  return {
    name: COOKIE,
    password,
    maxAge: 60 * 60 * 24 * 14,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },
  };
}

function legacyConfig(name: string): SessionConfig | null {
  const password = sessionPassword();
  if (!password) return null;
  return {
    name,
    password,
    maxAge: 60 * 60 * 24 * 14,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },
  };
}

export function jwtSubFromToken(token: string): string | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = JSON.parse(
      Buffer.from(part.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"),
    ) as { sub?: string };
    return typeof json.sub === "string" ? json.sub : null;
  } catch {
    return null;
  }
}

export function computeIsSuperAdmin(
  email: string,
  appMetadata: Record<string, unknown> | null | undefined,
): boolean {
  return userHasSuperAdminClaim(appMetadata) && isSuperAdminEmail(email);
}

export async function readAppSession(): Promise<AppSessionData | null> {
  const config = appSessionConfig();
  if (!config) return null;
  try {
    const session = await getSession<AppSessionData>(config);
    if (!session.data.email || !session.data.accessToken || !session.data.userId) {
      return null;
    }
    return {
      email: session.data.email,
      userId: session.data.userId,
      accessToken: session.data.accessToken,
      refreshToken: session.data.refreshToken ?? "",
      displayName: session.data.displayName || session.data.email,
      isSuperAdmin: Boolean(session.data.isSuperAdmin),
    };
  } catch {
    return null;
  }
}

/**
 * Migration read: prefer new cookie; fall back to legacy portal/admin cookies
 * so existing browsers keep working until next sign-in.
 */
export async function readAppSessionWithLegacyFallback(): Promise<AppSessionData | null> {
  const primary = await readAppSession();
  if (primary) return primary;

  // Legacy portal cookie (same shape).
  const portalCfg = legacyConfig("elsiaa_portal");
  if (portalCfg) {
    try {
      const session = await getSession<AppSessionData>(portalCfg);
      if (session.data.email && session.data.accessToken && session.data.userId) {
        const data: AppSessionData = {
          email: session.data.email,
          userId: session.data.userId,
          accessToken: session.data.accessToken,
          refreshToken: session.data.refreshToken ?? "",
          displayName: session.data.displayName || session.data.email,
          isSuperAdmin: Boolean(session.data.isSuperAdmin),
        };
        await writeAppSession(data);
        return data;
      }
    } catch {
      /* ignore */
    }
  }

  // Legacy admin cookie (narrower shape).
  type LegacyAdmin = {
    email?: string;
    role?: string;
    accessToken?: string;
    refreshToken?: string;
  };
  const adminCfg = legacyConfig("elsiaa_admin");
  if (adminCfg) {
    try {
      const session = await getSession<LegacyAdmin>(adminCfg);
      const email = session.data.email?.trim().toLowerCase();
      const accessToken = session.data.accessToken;
      if (email && accessToken && session.data.role === "super_admin" && isSuperAdminEmail(email)) {
        const userId = jwtSubFromToken(accessToken) || email;
        const data: AppSessionData = {
          email,
          userId,
          accessToken,
          refreshToken: session.data.refreshToken ?? "",
          displayName: email.split("@")[0] || email,
          isSuperAdmin: true,
        };
        await writeAppSession(data);
        return data;
      }
    } catch {
      /* ignore */
    }
  }

  return null;
}

export async function writeAppSession(input: AppSessionData): Promise<void> {
  const config = appSessionConfig();
  if (!config) throw new Error("App session secret not configured (set AUTH_SECRET)");
  const manager = await useSession<AppSessionData>(config);
  await manager.update({
    email: input.email.trim().toLowerCase(),
    userId: input.userId,
    accessToken: input.accessToken,
    refreshToken: input.refreshToken,
    displayName: input.displayName,
    isSuperAdmin: Boolean(input.isSuperAdmin),
  });
}

export async function destroyAppSession(): Promise<void> {
  const config = appSessionConfig();
  if (config) {
    try {
      await clearSession(config);
    } catch {
      /* ignore */
    }
  }
  for (const name of LEGACY_COOKIES) {
    const legacy = legacyConfig(name);
    if (!legacy) continue;
    try {
      await clearSession(legacy);
    } catch {
      /* ignore */
    }
  }
}

export async function requireAppUser(): Promise<AppSessionData> {
  const session = await readAppSessionWithLegacyFallback();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function requireAppSupabase(): Promise<{
  session: AppSessionData;
  client: SupabaseClient;
}> {
  let session = await requireAppUser();
  let client = getSupabaseUserClient(session.accessToken);
  if (!client) throw new Error("Supabase is not configured");

  const { data: userData, error: userError } = await client.auth.getUser(session.accessToken);
  if (userError || !userData.user) {
    const auth = getSupabaseAuthClient();
    if (!auth || !session.refreshToken) throw new Error("Unauthorized");
    const refreshed = await auth.auth.refreshSession({
      refresh_token: session.refreshToken,
    });
    if (refreshed.error || !refreshed.data.session) throw new Error("Unauthorized");
    const next = refreshed.data.session;
    const email = (next.user.email ?? session.email).toLowerCase();
    const displayName =
      (next.user.user_metadata?.display_name as string | undefined) ||
      (next.user.user_metadata?.full_name as string | undefined) ||
      email.split("@")[0] ||
      email;
    const meta = (next.user.app_metadata ?? {}) as Record<string, unknown>;
    session = {
      email,
      userId: next.user.id,
      accessToken: next.access_token,
      refreshToken: next.refresh_token,
      displayName,
      isSuperAdmin: computeIsSuperAdmin(email, meta),
    };
    await writeAppSession(session);
    client = getSupabaseUserClient(session.accessToken);
    if (!client) throw new Error("Supabase is not configured");
  } else {
    const meta = (userData.user.app_metadata ?? {}) as Record<string, unknown>;
    const nextFlag = computeIsSuperAdmin(session.email, meta);
    if (nextFlag !== session.isSuperAdmin) {
      session = { ...session, isSuperAdmin: nextFlag };
      await writeAppSession(session);
    }
  }

  return { session, client };
}

export async function requireSuperAdminSession(): Promise<AppSessionData> {
  const session = await requireAppUser();
  if (!session.isSuperAdmin || !isSuperAdminEmail(session.email)) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireSuperAdminSupabaseSession(): Promise<{
  session: AppSessionData;
  client: SupabaseClient;
}> {
  const { session, client } = await requireAppSupabase();
  if (!session.isSuperAdmin || !isSuperAdminEmail(session.email)) {
    throw new Error("Unauthorized");
  }
  const { data: userData } = await client.auth.getUser(session.accessToken);
  const meta = (userData.user?.app_metadata ?? {}) as Record<string, unknown>;
  if (!userHasSuperAdminClaim(meta)) throw new Error("Unauthorized");
  return { session, client };
}

export function appAuthReady(): boolean {
  return Boolean(appSessionConfig() && supabasePublishableConfigured());
}
