import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requirePortalSupabase } from "./session.server";
import { defaultFlagsForRole, emptyModuleFlags, navForWorkspace } from "./modules";
import type {
  CompanyModuleFlags,
  PortalCompany,
  PortalProject,
  PortalRole,
  PortalWorkspace,
} from "./types";

type MemberRow = {
  company_id: string;
  role: string;
  authorizations_allowed?: boolean;
  program_logs_allowed?: boolean;
  files_allowed?: boolean;
  support_allowed?: boolean;
  all_projects_access?: boolean;
  companies:
    | { id: string; name: string; created_at: string; updated_at: string }
    | { id: string; name: string; created_at: string; updated_at: string }[]
    | null;
};

const MEMBER_SELECT_FULL =
  "company_id, role, authorizations_allowed, program_logs_allowed, files_allowed, support_allowed, all_projects_access, companies(id, name, created_at, updated_at)";
const MEMBER_SELECT_BASIC = "company_id, role, companies(id, name, created_at, updated_at)";

function flagsFromMember(row: MemberRow, role: PortalRole): CompanyModuleFlags {
  const hasCols =
    "authorizations_allowed" in row || "files_allowed" in row || "support_allowed" in row;
  if (!hasCols) return defaultFlagsForRole(role);
  return {
    authorizationsAllowed: Boolean(row.authorizations_allowed),
    programLogsAllowed: Boolean(row.program_logs_allowed),
    filesAllowed: Boolean(row.files_allowed),
    supportAllowed: Boolean(row.support_allowed),
    allProjectsAccess: Boolean(row.all_projects_access),
  };
}

export const getPortalWorkspace = createServerFn({ method: "GET" }).handler(
  async (): Promise<PortalWorkspace> => {
    const { session, client } = await requirePortalSupabase();

    let memberships: MemberRow[] | null = null;
    const full = await client
      .from("company_members")
      .select(MEMBER_SELECT_FULL)
      .eq("user_id", session.userId)
      .limit(1);
    if (full.error) {
      const basic = await client
        .from("company_members")
        .select(MEMBER_SELECT_BASIC)
        .eq("user_id", session.userId)
        .limit(1);
      if (basic.error) throw new Error(basic.error.message);
      memberships = (basic.data as MemberRow[] | null) ?? null;
    } else {
      memberships = (full.data as MemberRow[] | null) ?? null;
    }

    const row = memberships?.[0] ?? null;
    let company: PortalCompany | null = null;
    let role: PortalRole | null = null;
    let flags = emptyModuleFlags();

    if (row) {
      const co = Array.isArray(row.companies) ? row.companies[0] : row.companies;
      role = (row.role as PortalRole) || "member";
      flags = flagsFromMember(row, role);
      if (co) {
        company = {
          id: co.id,
          name: co.name,
          createdAt: co.created_at,
          updatedAt: co.updated_at,
        };
      }
    }

    return {
      userId: session.userId,
      email: session.email,
      displayName: session.displayName,
      company,
      role,
      modules: flags,
      allowedNav: navForWorkspace({
        role,
        flags,
        hasCompany: Boolean(company),
      }),
    };
  },
);

export const listPortalProjects = createServerFn({ method: "GET" }).handler(
  async (): Promise<PortalProject[]> => {
    const { session, client } = await requirePortalSupabase();
    const { data: memberships, error: mErr } = await client
      .from("company_members")
      .select("company_id, role, all_projects_access")
      .eq("user_id", session.userId);
    if (mErr) {
      // Pre-migration: no all_projects_access column
      const fallback = await client
        .from("company_members")
        .select("company_id, role")
        .eq("user_id", session.userId);
      if (fallback.error) throw new Error(fallback.error.message);
      const companyIds = (fallback.data ?? []).map((m) => m.company_id as string);
      if (!companyIds.length) return [];
      const { data: projects, error } = await client
        .from("projects")
        .select("id, company_id, title, url, description, status, created_at, updated_at")
        .in("company_id", companyIds)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (projects ?? []).map(mapProject);
    }
    if (!memberships?.length) return [];

    const companyIds = memberships.map((m) => m.company_id as string);
    const { data: projects, error } = await client
      .from("projects")
      .select("id, company_id, title, url, description, status, created_at, updated_at")
      .in("company_id", companyIds)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const elevated = memberships.some(
      (m) => m.role === "owner" || m.role === "admin" || Boolean(m.all_projects_access),
    );
    if (elevated) return (projects ?? []).map(mapProject);

    const { data: grants, error: gErr } = await client
      .from("project_members")
      .select("project_id")
      .eq("user_id", session.userId);
    if (gErr) throw new Error(gErr.message);
    const allowed = new Set((grants ?? []).map((g) => g.project_id as string));
    return (projects ?? []).filter((p) => allowed.has(p.id as string)).map(mapProject);
  },
);

function mapProject(p: Record<string, unknown>): PortalProject {
  return {
    id: p.id as string,
    companyId: p.company_id as string,
    title: p.title as string,
    url: (p.url as string) ?? "",
    description: (p.description as string | undefined) ?? undefined,
    status: (p.status as string | undefined) ?? undefined,
    createdAt: p.created_at as string,
    updatedAt: p.updated_at as string,
  };
}
