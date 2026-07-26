import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSuperAdminSupabase } from "./session.server";

export type AdminProject = {
  id: string;
  companyId: string;
  companyName: string | null;
  title: string;
  url: string;
  description: string | null;
  status: string;
  deviceLimit: number | null;
  accessOverride: string | null;
  createdAt: string;
};

export const listAdminProjects = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminProject[]> => {
    const { client } = await requireSuperAdminSupabase();
    const { data, error } = await client
      .from("projects")
      .select(
        "id, company_id, title, url, description, status, device_limit, access_override, created_at, companies(name)",
      )
      .order("created_at", { ascending: false });
    if (error) {
      // Pre-parity migration: no device columns
      const fallback = await client
        .from("projects")
        .select(
          "id, company_id, title, url, description, status, created_at, companies(name)",
        )
        .order("created_at", { ascending: false });
      if (fallback.error) throw new Error(fallback.error.message);
      return (fallback.data ?? []).map((p) => mapAdminProject(p));
    }
    return (data ?? []).map((p) => mapAdminProject(p));
  },
);

function mapAdminProject(p: Record<string, unknown>): AdminProject {
  const co = p.companies as
    | { name: string }
    | { name: string }[]
    | null
    | undefined;
  const company = Array.isArray(co) ? co[0] : co;
  return {
    id: p.id as string,
    companyId: p.company_id as string,
    companyName: company?.name ?? null,
    title: p.title as string,
    url: (p.url as string) ?? "",
    description: (p.description as string | null) ?? null,
    status: (p.status as string) ?? "active",
    deviceLimit: (p.device_limit as number | null | undefined) ?? null,
    accessOverride: (p.access_override as string | null | undefined) ?? null,
    createdAt: p.created_at as string,
  };
}

export const createAdminProject = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      companyId: z.string().uuid(),
      title: z.string().min(1).max(200),
      url: z.string().max(500).optional(),
      description: z.string().max(2000).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { client } = await requireSuperAdminSupabase();
    const { data: row, error } = await client
      .from("projects")
      .insert({
        company_id: data.companyId,
        title: data.title.trim(),
        url: data.url?.trim() || "",
        description: data.description?.trim() || null,
        status: "active",
      })
      .select("id")
      .single();
    if (error || !row) throw new Error(error?.message ?? "Failed to create project");
    return { id: row.id as string };
  });

export const updateAdminProject = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      title: z.string().min(1).max(200).optional(),
      url: z.string().max(500).optional(),
      description: z.string().max(2000).nullable().optional(),
      status: z.enum(["active", "archived"]).optional(),
      deviceLimit: z.number().int().min(0).nullable().optional(),
      accessOverride: z.enum(["allowed", "blocked"]).nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { client } = await requireSuperAdminSupabase();
    const patch: Record<string, unknown> = {};
    if (data.title !== undefined) patch.title = data.title.trim();
    if (data.url !== undefined) patch.url = data.url.trim();
    if (data.description !== undefined) patch.description = data.description;
    if (data.status !== undefined) patch.status = data.status;
    if (data.deviceLimit !== undefined) patch.device_limit = data.deviceLimit;
    if (data.accessOverride !== undefined)
      patch.access_override = data.accessOverride;
    const { error } = await client.from("projects").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteAdminProject = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { client } = await requireSuperAdminSupabase();
    const { error } = await client.from("projects").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
