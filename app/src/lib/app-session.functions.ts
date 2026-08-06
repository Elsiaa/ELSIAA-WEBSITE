import { createServerFn } from "@tanstack/react-start";
import {
  computeIsSuperAdmin,
  readAppSessionWithLegacyFallback,
  writeAppSession,
} from "./app-session.server";
import { isSuperAdminEmail } from "./admin/super-admin";

function appMetadataFromAccessToken(accessToken: string): Record<string, unknown> | null {
  try {
    const part = accessToken.split(".")[1];
    if (!part) return null;
    const json = JSON.parse(
      Buffer.from(part.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"),
    ) as { app_metadata?: Record<string, unknown> };
    return json.app_metadata ?? null;
  } catch {
    return null;
  }
}

/**
 * Unified session for Poel shims (next-auth useSession) and admin page gates.
 * One Supabase JWT cookie powers portal + admin.
 */
export const getAppSessionState = createServerFn({ method: "GET" }).handler(async () => {
  const session = await readAppSessionWithLegacyFallback();

  if (session?.userId || session?.email) {
    let isSuperAdmin = Boolean(session.isSuperAdmin);
    if (session.email && session.accessToken) {
      const meta = appMetadataFromAccessToken(session.accessToken);
      const next = computeIsSuperAdmin(session.email, meta);
      if (next !== isSuperAdmin) {
        isSuperAdmin = next;
        try {
          await writeAppSession({ ...session, isSuperAdmin: next });
        } catch {
          /* ignore */
        }
      } else if (!isSuperAdmin && isSuperAdminEmail(session.email)) {
        isSuperAdmin = true;
      }
    } else if (session.email && isSuperAdminEmail(session.email)) {
      isSuperAdmin = true;
    }

    return {
      authenticated: true as const,
      userId: session.userId ?? null,
      email: session.email ?? null,
      name: session.displayName ?? session.email?.split("@")[0] ?? null,
      isSuperAdmin,
      via: null as "admin" | "portal" | null,
    };
  }

  return {
    authenticated: false as const,
    userId: null,
    email: null,
    name: null,
    isSuperAdmin: false,
    via: null,
  };
});
