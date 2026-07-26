import { createServerFn } from "@tanstack/react-start";
import { readAppSessionWithLegacyFallback } from "./app-session.server";

/**
 * Unified session for Poel shims (next-auth useSession) and admin page gates.
 * One Supabase JWT cookie powers portal + admin.
 */
export const getAppSessionState = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await readAppSessionWithLegacyFallback();

    if (session?.userId || session?.email) {
      return {
        authenticated: true as const,
        userId: session.userId ?? null,
        email: session.email ?? null,
        name: session.displayName ?? session.email?.split("@")[0] ?? null,
        isSuperAdmin: Boolean(session.isSuperAdmin),
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
  },
);
