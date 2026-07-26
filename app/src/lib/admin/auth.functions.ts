import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { computeIsSuperAdmin } from "../app-session.server";
import {
  supabasePublishableConfigured,
  getSupabaseAuthClient,
  userHasSuperAdminClaim,
} from "../portal/supabase";
import {
  destroyAdminSession,
  readAdminSession,
  writeAdminSession,
  adminSessionConfig,
} from "./session.server";
import {
  isSuperAdminEmail,
  parseSuperAdminEmails,
  superAdminConfigured,
} from "./super-admin";

export const getAdminAuthState = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await readAdminSession();
    return {
      authenticated: Boolean(session),
      email: session?.email ?? null,
      superAdminConfigured: superAdminConfigured(),
      sessionReady: Boolean(adminSessionConfig()),
      supabaseReady: supabasePublishableConfigured(),
      allowlistCount: parseSuperAdminEmails().length,
    };
  },
);

export const adminSignIn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    if (!superAdminConfigured()) {
      return {
        ok: false as const,
        error: "SUPER_ADMIN_EMAILS is not set on the server.",
      };
    }
    if (!adminSessionConfig()) {
      return {
        ok: false as const,
        error: "Set AUTH_SECRET (32+ chars preferred) to seal the session.",
      };
    }
    if (!supabasePublishableConfigured()) {
      return {
        ok: false as const,
        error: "Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.",
      };
    }
    if (!isSuperAdminEmail(data.email)) {
      return { ok: false as const, error: "This email is not on SUPER_ADMIN_EMAILS." };
    }

    const auth = getSupabaseAuthClient();
    if (!auth) {
      return { ok: false as const, error: "Supabase auth client unavailable." };
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

    const meta = (signed.user.app_metadata ?? {}) as Record<string, unknown>;
    if (!userHasSuperAdminClaim(meta)) {
      return {
        ok: false as const,
        error:
          "Supabase user is missing app_metadata.role = super_admin. Run the promote SQL.",
      };
    }

    const email = (signed.user.email ?? data.email).trim().toLowerCase();
    if (!computeIsSuperAdmin(email, meta)) {
      return { ok: false as const, error: "Not authorized as super admin." };
    }

    const displayName =
      (signed.user.user_metadata?.display_name as string | undefined) ||
      email.split("@")[0] ||
      email;

    await writeAdminSession({
      email,
      accessToken: signed.session.access_token,
      refreshToken: signed.session.refresh_token,
      userId: signed.user.id,
      displayName,
    });
    return { ok: true as const, email };
  });

export const adminSignOut = createServerFn({ method: "POST" }).handler(
  async () => {
    await destroyAdminSession();
    return { ok: true as const };
  },
);
