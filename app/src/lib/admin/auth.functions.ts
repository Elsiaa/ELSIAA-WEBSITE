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
import { isSuperAdminEmail, parseSuperAdminEmails, superAdminConfigured } from "./super-admin";

export const getAdminAuthState = createServerFn({ method: "GET" }).handler(async () => {
  const session = await readAdminSession();
  return {
    authenticated: Boolean(session),
    email: session?.email ?? null,
    superAdminConfigured: superAdminConfigured(),
    sessionReady: Boolean(adminSessionConfig()),
    supabaseReady: supabasePublishableConfigured(),
    allowlistCount: parseSuperAdminEmails().length,
  };
});

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
        error: "Admin sign-in is not available.",
      };
    }
    if (!adminSessionConfig()) {
      return {
        ok: false as const,
        error: "Admin sign-in is not available.",
      };
    }
    if (!supabasePublishableConfigured()) {
      return {
        ok: false as const,
        error: "Sign-in is temporarily unavailable. Try again later.",
      };
    }
    if (!isSuperAdminEmail(data.email)) {
      return { ok: false as const, error: "This email is not authorized for admin access." };
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

    const meta = (signed.user.app_metadata ?? {}) as Record<string, unknown>;
    if (!userHasSuperAdminClaim(meta)) {
      return {
        ok: false as const,
        error: "This account is not authorized for admin access.",
      };
    }

    const email = (signed.user.email ?? data.email).trim().toLowerCase();
    if (!computeIsSuperAdmin(email, meta)) {
      return { ok: false as const, error: "This account is not authorized for admin access." };
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

export const adminSignOut = createServerFn({ method: "POST" }).handler(async () => {
  await destroyAdminSession();
  return { ok: true as const };
});
