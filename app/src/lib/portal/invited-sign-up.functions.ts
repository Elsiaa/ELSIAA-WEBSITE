/**
 * Invite-only account activation: set password via Supabase Auth, link public.users.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { normalizeEmailForAuth } from "@/lib/email-normalize";
import { verifyInvitationToken } from "@/lib/invitations";
import { isPlatformSupportAgent } from "@/lib/platform-role";
import { portalSessionConfig, writePortalSession } from "@/lib/portal/session.server";
import {
  getSupabaseAuthClient,
  getSupabaseServiceClient,
  supabasePublishableConfigured,
  supabaseSecretConfigured,
} from "@/lib/portal/supabase";
import { supportAgentHasGrantRowForCompany } from "@/lib/support-agent-grants";
import { getUserByEmailNormalized, updateUser } from "@/lib/users";
import type { UpdateUserInput } from "@/types/company";

export const previewInvitation = createServerFn({ method: "GET" })
  .inputValidator(z.object({ invitation: z.string().min(1) }))
  .handler(async ({ data }) => {
    const payload = verifyInvitationToken(data.invitation.trim());
    if (!payload) {
      return { ok: false as const, error: "invalid" as const };
    }
    return {
      ok: true as const,
      email: normalizeEmailForAuth(payload.email),
      companyId: payload.companyId,
    };
  });

export const completeInvitedSignUp = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      invitation: z.string().min(1),
      password: z.string().min(8),
    }),
  )
  .handler(async ({ data }) => {
    if (!supabaseSecretConfigured() || !supabasePublishableConfigured()) {
      return {
        ok: false as const,
        error:
          "Supabase is not configured. Set SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, and SUPABASE_SECRET_KEY.",
      };
    }
    if (!portalSessionConfig()) {
      return {
        ok: false as const,
        error: "Set AUTH_SECRET (32+ chars) to seal the portal session.",
      };
    }

    const payload = verifyInvitationToken(data.invitation.trim());
    if (!payload) {
      return { ok: false as const, error: "Invalid or expired invitation." };
    }

    const email = normalizeEmailForAuth(payload.email);
    if (!email) {
      return { ok: false as const, error: "Invalid invitation email." };
    }

    const appUser = await getUserByEmailNormalized(email);
    if (!appUser) {
      return {
        ok: false as const,
        error:
          "No pending invitation matches this link. Ask your admin to resend the invite.",
      };
    }

    let invitationMatchesCompany = appUser.company_id === payload.companyId;
    if (!invitationMatchesCompany && isPlatformSupportAgent(appUser.platform_role)) {
      invitationMatchesCompany = await supportAgentHasGrantRowForCompany(
        appUser.id,
        payload.companyId,
      );
    }
    if (!invitationMatchesCompany) {
      return {
        ok: false as const,
        error:
          "No pending invitation matches this link. Ask your admin to resend the invite.",
      };
    }

    if (appUser.status === "inactive") {
      return {
        ok: false as const,
        error: "This account is inactive. Contact your administrator.",
      };
    }

    if (appUser.auth_user_id) {
      return {
        ok: false as const,
        error:
          "This invitation was already used. Sign in with your email and password.",
      };
    }

    const admin = getSupabaseServiceClient();
    if (!admin) {
      return { ok: false as const, error: "Supabase service client unavailable." };
    }

    const displayName =
      [appUser.first_name, appUser.last_name].filter(Boolean).join(" ").trim() ||
      email.split("@")[0] ||
      "User";

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        first_name: appUser.first_name,
        last_name: appUser.last_name,
        display_name: displayName,
      },
    });

    let authUserId = created?.user?.id as string | undefined;

    if (createErr || !authUserId) {
      const msg = (createErr?.message ?? "").toLowerCase();
      const already =
        msg.includes("already") ||
        msg.includes("registered") ||
        msg.includes("exists");
      if (!already) {
        return {
          ok: false as const,
          error: createErr?.message ?? "Could not create login account.",
        };
      }

      // Email already in Auth — only allow if not yet linked to a workspace user.
      const { getSupabaseAuthUserIdForEmail } = await import(
        "@/lib/supabase-auth-lookup"
      );
      const existingId = await getSupabaseAuthUserIdForEmail(email);
      if (!existingId) {
        return {
          ok: false as const,
          error:
            "An account with this email already exists. Sign in, or ask your admin to resend the invite.",
        };
      }
      const { error: pwErr } = await admin.auth.admin.updateUserById(existingId, {
        password: data.password,
        email_confirm: true,
      });
      if (pwErr) {
        return {
          ok: false as const,
          error: pwErr.message || "Could not set password for existing account.",
        };
      }
      authUserId = existingId;
    }

    const updates: UpdateUserInput = {
      auth_user_id: authUserId,
      status: "active",
      is_active: true,
      ...(!isPlatformSupportAgent(appUser.platform_role)
        ? { all_projects_access: true }
        : {}),
    };

    await updateUser(appUser.id, updates);

    // Portal membership is keyed by Auth user id.
    if (appUser.company_id) {
      const elevated = appUser.role === "admin";
      const { error: memErr } = await admin.from("company_members").upsert(
        {
          company_id: appUser.company_id,
          user_id: authUserId,
          role: elevated ? "admin" : "member",
          authorizations_allowed: Boolean(
            appUser.authorizations_allowed ?? elevated,
          ),
          program_logs_allowed: Boolean(
            appUser.program_logs_allowed ?? elevated,
          ),
          files_allowed: Boolean(appUser.files_allowed ?? elevated),
          support_allowed: Boolean(appUser.support_allowed ?? elevated),
          all_projects_access: Boolean(
            appUser.all_projects_access ?? elevated,
          ),
        },
        { onConflict: "company_id,user_id" },
      );
      if (memErr) {
        console.error("completeInvitedSignUp company_members:", memErr);
      }
    }

    // Optional profiles row (ELSIAA schema).
    {
      const { error: profileErr } = await admin.from("profiles").upsert(
        {
          id: authUserId,
          email,
          display_name: displayName,
          first_name: appUser.first_name,
          last_name: appUser.last_name,
          is_active: true,
        },
        { onConflict: "id" },
      );
      if (profileErr) {
        console.warn("completeInvitedSignUp profiles:", profileErr.message);
      }
    }

    // Sign in immediately so they land in the portal.
    const auth = getSupabaseAuthClient();
    if (auth) {
      const { data: signed, error: signErr } = await auth.auth.signInWithPassword({
        email,
        password: data.password,
      });
      if (!signErr && signed.session && signed.user) {
        await writePortalSession({
          email,
          userId: signed.user.id,
          accessToken: signed.session.access_token,
          refreshToken: signed.session.refresh_token,
          displayName,
          isSuperAdmin: false,
        });
        return {
          ok: true as const,
          email,
          redirectTo: "/portal" as const,
        };
      }
    }

    return {
      ok: true as const,
      email,
      redirectTo: "/portal/sign-in" as const,
    };
  });
