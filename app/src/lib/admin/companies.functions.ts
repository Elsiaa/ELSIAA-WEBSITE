import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSuperAdminSupabase } from "./session.server";

export type AdminCompany = {
  id: string;
  name: string;
  slug: string | null;
  stripeCustomerId: string | null;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
};

export type AdminCompanyMember = {
  companyId: string;
  userId: string;
  role: "owner" | "admin" | "member";
  email: string | null;
  displayName: string | null;
  createdAt: string;
  authorizationsAllowed: boolean;
  programLogsAllowed: boolean;
  filesAllowed: boolean;
  supportAllowed: boolean;
  allProjectsAccess: boolean;
};

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export const listAdminCompanies = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminCompany[]> => {
    const { client } = await requireSuperAdminSupabase();
    const { data, error } = await client
      .from("companies")
      .select("id, name, slug, stripe_customer_id, created_at, updated_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const companies = data ?? [];
    if (companies.length === 0) return [];

    const ids = companies.map((c) => c.id as string);
    const { data: members, error: memErr } = await client
      .from("company_members")
      .select("company_id")
      .in("company_id", ids);
    if (memErr) throw new Error(memErr.message);

    const counts = new Map<string, number>();
    for (const m of members ?? []) {
      const id = m.company_id as string;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }

    return companies.map((c) => ({
      id: c.id as string,
      name: c.name as string,
      slug: (c.slug as string | null) ?? null,
      stripeCustomerId: (c.stripe_customer_id as string | null) ?? null,
      createdAt: c.created_at as string,
      updatedAt: c.updated_at as string,
      memberCount: counts.get(c.id as string) ?? 0,
    }));
  },
);

export const createAdminCompany = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      name: z.string().min(1).max(200),
      slug: z.string().min(1).max(60).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { client } = await requireSuperAdminSupabase();
    const slug = data.slug?.trim() || slugify(data.name);
    const { data: row, error } = await client
      .from("companies")
      .insert({
        name: data.name.trim(),
        slug: slug || null,
      })
      .select("id, name, slug, stripe_customer_id, created_at, updated_at")
      .single();
    if (error || !row) throw new Error(error?.message ?? "Failed to create company");
    return {
      id: row.id as string,
      name: row.name as string,
      slug: (row.slug as string | null) ?? null,
      stripeCustomerId: (row.stripe_customer_id as string | null) ?? null,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
      memberCount: 0,
    } satisfies AdminCompany;
  });

export const updateAdminCompany = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(200).optional(),
      slug: z.string().min(1).max(60).nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { client } = await requireSuperAdminSupabase();
    const patch: Record<string, unknown> = {};
    if (data.name !== undefined) patch.name = data.name.trim();
    if (data.slug !== undefined) patch.slug = data.slug?.trim() || null;
    const { data: row, error } = await client
      .from("companies")
      .update(patch)
      .eq("id", data.id)
      .select("id, name, slug, stripe_customer_id, created_at, updated_at")
      .single();
    if (error || !row) throw new Error(error?.message ?? "Failed to update company");
    return {
      id: row.id as string,
      name: row.name as string,
      slug: (row.slug as string | null) ?? null,
      stripeCustomerId: (row.stripe_customer_id as string | null) ?? null,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
      memberCount: 0,
    } satisfies AdminCompany;
  });

export const deleteAdminCompany = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { client } = await requireSuperAdminSupabase();
    const { error } = await client.from("companies").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const listCompanyMembers = createServerFn({ method: "GET" })
  .inputValidator(z.object({ companyId: z.string().uuid() }))
  .handler(async ({ data }): Promise<AdminCompanyMember[]> => {
    const { client } = await requireSuperAdminSupabase();
    let rows: Record<string, unknown>[] | null = null;
    const full = await client
      .from("company_members")
      .select(
        "company_id, user_id, role, created_at, authorizations_allowed, program_logs_allowed, files_allowed, support_allowed, all_projects_access",
      )
      .eq("company_id", data.companyId)
      .order("created_at", { ascending: true });
    if (full.error) {
      const basic = await client
        .from("company_members")
        .select("company_id, user_id, role, created_at")
        .eq("company_id", data.companyId)
        .order("created_at", { ascending: true });
      if (basic.error) throw new Error(basic.error.message);
      rows = (basic.data as Record<string, unknown>[] | null) ?? null;
    } else {
      rows = (full.data as Record<string, unknown>[] | null) ?? null;
    }
    if (!rows?.length) return [];

    const userIds = rows.map((r) => r.user_id as string);
    const { data: profiles, error: pErr } = await client
      .from("profiles")
      .select("id, email, display_name")
      .in("id", userIds);
    if (pErr) throw new Error(pErr.message);
    const byId = new Map(
      (profiles ?? []).map((p) => [
        p.id as string,
        {
          email: (p.email as string | null) ?? null,
          displayName: (p.display_name as string | null) ?? null,
        },
      ]),
    );

    return rows.map((r) => {
      const profile = byId.get(r.user_id as string);
      const isElevated = r.role === "owner" || r.role === "admin";
      return {
        companyId: r.company_id as string,
        userId: r.user_id as string,
        role: r.role as "owner" | "admin" | "member",
        email: profile?.email ?? null,
        displayName: profile?.displayName ?? null,
        createdAt: r.created_at as string,
        authorizationsAllowed:
          (r.authorizations_allowed as boolean | undefined) ?? isElevated,
        programLogsAllowed:
          (r.program_logs_allowed as boolean | undefined) ?? isElevated,
        filesAllowed: (r.files_allowed as boolean | undefined) ?? isElevated,
        supportAllowed: (r.support_allowed as boolean | undefined) ?? isElevated,
        allProjectsAccess:
          (r.all_projects_access as boolean | undefined) ?? isElevated,
      };
    });
  });

export const addCompanyMemberByEmail = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      companyId: z.string().uuid(),
      email: z.string().email(),
      role: z.enum(["owner", "admin", "member"]).default("member"),
    }),
  )
  .handler(async ({ data }) => {
    const { client } = await requireSuperAdminSupabase();
    const email = data.email.trim().toLowerCase();
    const { data: profile, error: pErr } = await client
      .from("profiles")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!profile?.id) {
      throw new Error(
        `No profile for ${email}. Create the user in Supabase Auth first (they get a profiles row on signup).`,
      );
    }
    const { error } = await client.from("company_members").upsert(
      {
        company_id: data.companyId,
        user_id: profile.id,
        role: data.role,
      },
      { onConflict: "company_id,user_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const removeCompanyMember = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      companyId: z.string().uuid(),
      userId: z.string().uuid(),
    }),
  )
  .handler(async ({ data }) => {
    const { client } = await requireSuperAdminSupabase();
    const { error } = await client
      .from("company_members")
      .delete()
      .eq("company_id", data.companyId)
      .eq("user_id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const updateCompanyMemberAccess = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      companyId: z.string().uuid(),
      userId: z.string().uuid(),
      role: z.enum(["owner", "admin", "member"]).optional(),
      authorizationsAllowed: z.boolean().optional(),
      programLogsAllowed: z.boolean().optional(),
      filesAllowed: z.boolean().optional(),
      supportAllowed: z.boolean().optional(),
      allProjectsAccess: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { client } = await requireSuperAdminSupabase();
    const patch: Record<string, unknown> = {};
    if (data.role !== undefined) patch.role = data.role;
    if (data.authorizationsAllowed !== undefined)
      patch.authorizations_allowed = data.authorizationsAllowed;
    if (data.programLogsAllowed !== undefined)
      patch.program_logs_allowed = data.programLogsAllowed;
    if (data.filesAllowed !== undefined) patch.files_allowed = data.filesAllowed;
    if (data.supportAllowed !== undefined)
      patch.support_allowed = data.supportAllowed;
    if (data.allProjectsAccess !== undefined)
      patch.all_projects_access = data.allProjectsAccess;
    const { error } = await client
      .from("company_members")
      .update(patch)
      .eq("company_id", data.companyId)
      .eq("user_id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
