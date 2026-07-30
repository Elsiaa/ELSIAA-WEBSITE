import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  computeIsSuperAdmin,
  writeAppSession,
} from "../app-session.server";
import { isSuperAdminEmail } from "../admin/super-admin";
import { portalConfigured, portalEnv } from "./env";
import {
  destroyPortalSession,
  portalAuthReady,
  portalSessionConfig,
  readPortalSession,
  writePortalSession,
} from "./session.server";
import {
  getSupabaseAuthClient,
  supabasePublishableConfigured,
} from "./supabase";

function appMetadataFromAccessToken(
  accessToken: string,
): Record<string, unknown> | null {
  try {
    const part = accessToken.split(".")[1];
    if (!part) return null;
    const json = JSON.parse(
      Buffer.from(part.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(
        "utf8",
      ),
    ) as { app_metadata?: Record<string, unknown> };
    return json.app_metadata ?? null;
  } catch {
    return null;
  }
}

export const getPortalAuthState = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await readPortalSession();
    const configured = portalConfigured();

    let isSuperAdmin = Boolean(session?.isSuperAdmin);
    if (session?.email && session.accessToken) {
      const meta = appMetadataFromAccessToken(session.accessToken);
      const next = computeIsSuperAdmin(session.email, meta);
      if (next !== isSuperAdmin) {
        isSuperAdmin = next;
        try {
          await writeAppSession({ ...session, isSuperAdmin: next });
        } catch {
          /* cookie write best-effort */
        }
      } else if (!isSuperAdmin && isSuperAdminEmail(session.email)) {
        // Allowlist alone is enough for UI routing; JWT claim may lag a stale cookie.
        isSuperAdmin = true;
      }
    } else if (session?.email && isSuperAdminEmail(session.email)) {
      isSuperAdmin = true;
    }

    return {
      authenticated: Boolean(session),
      email: session?.email ?? null,
      displayName: session?.displayName ?? null,
      userId: session?.userId ?? null,
      isSuperAdmin,
      authReady: portalAuthReady(),
      sessionReady: Boolean(portalSessionConfig()),
      supabaseReady: supabasePublishableConfigured(),
      backendReady: configured.database || configured.supabase,
      services: configured,
    };
  },
);

export const portalSignIn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    if (!portalSessionConfig()) {
      return {
        ok: false as const,
        error: "Sign-in is temporarily unavailable. Try again later.",
      };
    }
    if (!supabasePublishableConfigured()) {
      return {
        ok: false as const,
        error: "Sign-in is temporarily unavailable. Try again later.",
      };
    }

    const auth = getSupabaseAuthClient();
    if (!auth) {
      return { ok: false as const, error: "Sign-in is temporarily unavailable. Try again later." };
    }

    const { data: signed, error } = await auth.auth.signInWithPassword({
      email: data.email.trim(),
      password: data.password,
    });

    if (error || !signed.session || !signed.user) {
      return {
        ok: false as const,
        error: error?.message ?? "Invalid email or password.",
      };
    }

    const email = (signed.user.email ?? data.email).trim().toLowerCase();
    const displayName =
      (signed.user.user_metadata?.display_name as string | undefined) ||
      (signed.user.user_metadata?.full_name as string | undefined) ||
      (signed.user.user_metadata?.first_name as string | undefined) ||
      email.split("@")[0] ||
      email;

    const meta = (signed.user.app_metadata ?? {}) as Record<string, unknown>;
    const isSuperAdmin = computeIsSuperAdmin(email, meta);

    try {
      const { ensurePoelUserRow } = await import("../ensure-poel-user");
      await ensurePoelUserRow({
        authUserId: signed.user.id,
        email,
        firstName:
          (signed.user.user_metadata?.first_name as string | undefined) ?? null,
        lastName:
          (signed.user.user_metadata?.last_name as string | undefined) ?? null,
      });
    } catch {
      /* users table may not exist until migration 0005 */
    }

    await writePortalSession({
      email,
      userId: signed.user.id,
      accessToken: signed.session.access_token,
      refreshToken: signed.session.refresh_token,
      displayName,
      isSuperAdmin,
    });

    return {
      ok: true as const,
      email,
      displayName,
      isSuperAdmin,
      redirectTo: "/portal" as const,
    };
  });

export const portalSignOut = createServerFn({ method: "POST" }).handler(
  async () => {
    await destroyPortalSession();
    return { ok: true as const };
  },
);

/** Lightweight server status for UI banners (env is server-only). */
export const getPortalBackendStatus = createServerFn({ method: "GET" }).handler(
  async () => {
    const configured = portalConfigured();
    const e = portalEnv();
    return {
      backendReady: configured.database || configured.supabase,
      supabase: configured.supabase,
      hasUrl: Boolean(e.supabaseUrl),
      hasPublishableKey: Boolean(e.supabaseAnonKey),
    };
  },
);
