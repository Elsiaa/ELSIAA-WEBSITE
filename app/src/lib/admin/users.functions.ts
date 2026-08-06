import { randomBytes } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServiceClient, supabaseSecretConfigured } from "../portal/supabase";
import { requireSuperAdmin, requireSuperAdminSupabase } from "./session.server";

export type AdminPortalUser = {
  id: string;
  email: string | null;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
  createdAt: string;
  companies: Array<{ id: string; name: string; role: string }>;
};

function requireAuthAdmin() {
  const client = getSupabaseServiceClient();
  if (!client || !supabaseSecretConfigured()) {
    throw new Error("SUPABASE_SECRET_KEY is required to create Auth users from admin.");
  }
  return client;
}

function generateTempPassword(): string {
  return `Els-${randomBytes(9).toString("base64url")}!1`;
}

export const listAdminUsers = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminPortalUser[]> => {
    const { client } = await requireSuperAdminSupabase();
    const { data: profiles, error } = await client
      .from("profiles")
      .select("id, email, display_name, first_name, last_name, is_active, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    if (!profiles?.length) return [];

    const ids = profiles.map((p) => p.id as string);
    const { data: memberships, error: mErr } = await client
      .from("company_members")
      .select("user_id, role, companies(id, name)")
      .in("user_id", ids);
    if (mErr) throw new Error(mErr.message);

    const byUser = new Map<string, Array<{ id: string; name: string; role: string }>>();
    for (const row of memberships ?? []) {
      const userId = row.user_id as string;
      const company = row.companies as
        { id: string; name: string } | { id: string; name: string }[] | null;
      const co = Array.isArray(company) ? company[0] : company;
      if (!co) continue;
      const list = byUser.get(userId) ?? [];
      list.push({ id: co.id, name: co.name, role: row.role as string });
      byUser.set(userId, list);
    }

    return profiles.map((p) => ({
      id: p.id as string,
      email: (p.email as string | null) ?? null,
      displayName: (p.display_name as string | null) ?? null,
      firstName: (p.first_name as string | null) ?? null,
      lastName: (p.last_name as string | null) ?? null,
      isActive: Boolean(p.is_active ?? true),
      createdAt: p.created_at as string,
      companies: byUser.get(p.id as string) ?? [],
    }));
  },
);

export const createAdminUser = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      email: z.string().email(),
      password: z.string().min(8).optional(),
      firstName: z.string().max(80).optional(),
      lastName: z.string().max(80).optional(),
      displayName: z.string().max(120).optional(),
      companyId: z.string().uuid().optional(),
      companyRole: z.enum(["owner", "admin", "member"]).optional(),
      authorizationsAllowed: z.boolean().optional(),
      programLogsAllowed: z.boolean().optional(),
      filesAllowed: z.boolean().optional(),
      supportAllowed: z.boolean().optional(),
      allProjectsAccess: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await requireSuperAdmin();
    const admin = requireAuthAdmin();
    const { client } = await requireSuperAdminSupabase();

    const email = data.email.trim().toLowerCase();
    const password = data.password?.trim() || generateTempPassword();
    const passwordGenerated = !data.password?.trim();
    const firstName = data.firstName?.trim() || null;
    const lastName = data.lastName?.trim() || null;
    const displayName =
      data.displayName?.trim() ||
      [firstName, lastName].filter(Boolean).join(" ") ||
      email.split("@")[0];

    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        display_name: displayName,
      },
    });
    if (error || !created.user) {
      throw new Error(error?.message ?? "Failed to create Auth user");
    }

    const userId = created.user.id;

    // Ensure profile row is complete (trigger may have already inserted).
    const { error: profileErr } = await client.from("profiles").upsert(
      {
        id: userId,
        email,
        display_name: displayName,
        first_name: firstName,
        last_name: lastName,
        is_active: true,
      },
      { onConflict: "id" },
    );
    if (profileErr) throw new Error(profileErr.message);

    if (data.companyId) {
      const role = data.companyRole ?? "member";
      const elevated = role === "owner" || role === "admin";
      const { error: memErr } = await client.from("company_members").upsert(
        {
          company_id: data.companyId,
          user_id: userId,
          role,
          authorizations_allowed: data.authorizationsAllowed ?? elevated,
          program_logs_allowed: data.programLogsAllowed ?? elevated,
          files_allowed: data.filesAllowed ?? elevated,
          support_allowed: data.supportAllowed ?? elevated,
          all_projects_access: data.allProjectsAccess ?? elevated,
        },
        { onConflict: "company_id,user_id" },
      );
      if (memErr) throw new Error(memErr.message);
    }

    return {
      ok: true as const,
      userId,
      email,
      passwordGenerated,
      /** Shown once when we generated it — copy now. */
      temporaryPassword: passwordGenerated ? password : null,
    };
  });

export const setAdminUserActive = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      userId: z.string().uuid(),
      isActive: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    const { client } = await requireSuperAdminSupabase();
    const { error } = await client
      .from("profiles")
      .update({ is_active: data.isActive })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);

    // Ban/unban in Auth when secret key is available
    if (supabaseSecretConfigured()) {
      const admin = requireAuthAdmin();
      if (!data.isActive) {
        await admin.auth.admin.updateUserById(data.userId, {
          ban_duration: "876000h",
        });
      } else {
        await admin.auth.admin.updateUserById(data.userId, {
          ban_duration: "none",
        });
      }
    }
    return { ok: true as const };
  });

export const resetAdminUserPassword = createServerFn({ method: "POST" })
  .inputValidator(z.object({ userId: z.string().uuid() }))
  .handler(async ({ data }) => {
    await requireSuperAdmin();
    const admin = requireAuthAdmin();
    const password = generateTempPassword();
    const { error } = await admin.auth.admin.updateUserById(data.userId, {
      password,
    });
    if (error) throw new Error(error.message);
    return { ok: true as const, temporaryPassword: password };
  });

export const deleteAdminUser = createServerFn({ method: "POST" })
  .inputValidator(z.object({ userId: z.string().uuid() }))
  .handler(async ({ data }) => {
    await requireSuperAdmin();
    const admin = requireAuthAdmin();
    const { error } = await admin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const listCompaniesForUserForm = createServerFn({ method: "GET" }).handler(async () => {
  const { client } = await requireSuperAdminSupabase();
  const { data, error } = await client
    .from("companies")
    .select("id, name")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((c) => ({
    id: c.id as string,
    name: c.name as string,
  }));
});
