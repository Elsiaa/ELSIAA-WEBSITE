import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requirePortalSupabase } from "./session.server";
import type { CompanyModuleFlags, PortalRole } from "./types";

async function requireCompanyContext() {
  const { session, client } = await requirePortalSupabase();
  const { data: memberships, error } = await client
    .from("company_members")
    .select(
      "company_id, role, authorizations_allowed, program_logs_allowed, files_allowed, support_allowed, all_projects_access",
    )
    .eq("user_id", session.userId)
    .limit(1);
  if (error) {
    const basic = await client
      .from("company_members")
      .select("company_id, role")
      .eq("user_id", session.userId)
      .limit(1);
    if (basic.error) throw new Error(basic.error.message);
    const row = basic.data?.[0];
    if (!row) throw new Error("No company membership");
    return {
      session,
      client,
      companyId: row.company_id as string,
      role: row.role as PortalRole,
      flags: {
        authorizationsAllowed: row.role === "owner" || row.role === "admin",
        programLogsAllowed: row.role === "owner" || row.role === "admin",
        filesAllowed: row.role === "owner" || row.role === "admin",
        supportAllowed: row.role === "owner" || row.role === "admin",
        allProjectsAccess: row.role === "owner" || row.role === "admin",
      } satisfies CompanyModuleFlags,
    };
  }
  const row = memberships?.[0];
  if (!row) throw new Error("No company membership");
  const role = row.role as PortalRole;
  return {
    session,
    client,
    companyId: row.company_id as string,
    role,
    flags: {
      authorizationsAllowed: Boolean(row.authorizations_allowed),
      programLogsAllowed: Boolean(row.program_logs_allowed),
      filesAllowed: Boolean(row.files_allowed),
      supportAllowed: Boolean(row.support_allowed),
      allProjectsAccess: Boolean(row.all_projects_access),
    } satisfies CompanyModuleFlags,
  };
}

function isCompanyAdmin(role: PortalRole) {
  return role === "owner" || role === "admin";
}

// ── Files ──────────────────────────────────────────────────────────────────

export type PortalFile = {
  id: string;
  name: string;
  contentType: string | null;
  sizeBytes: number | null;
  createdAt: string;
};

export const listPortalFiles = createServerFn({ method: "GET" }).handler(
  async (): Promise<PortalFile[]> => {
    const { client, companyId, role, flags } = await requireCompanyContext();
    if (!flags.filesAllowed && !isCompanyAdmin(role)) {
      throw new Error("Files module not enabled for your account");
    }
    const { data, error } = await client
      .from("company_files")
      .select("id, name, content_type, size_bytes, created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      id: r.id as string,
      name: r.name as string,
      contentType: (r.content_type as string | null) ?? null,
      sizeBytes: (r.size_bytes as number | null) ?? null,
      createdAt: r.created_at as string,
    }));
  },
);

export const registerPortalFile = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      name: z.string().min(1).max(240),
      storageKey: z.string().min(1).max(500),
      contentType: z.string().max(120).optional(),
      sizeBytes: z.number().int().nonnegative().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { session, client, companyId, role, flags } = await requireCompanyContext();
    if (!flags.filesAllowed && !isCompanyAdmin(role)) {
      throw new Error("Files module not enabled for your account");
    }
    const { error } = await client.from("company_files").insert({
      company_id: companyId,
      name: data.name.trim(),
      storage_key: data.storageKey.trim(),
      content_type: data.contentType?.trim() || null,
      size_bytes: data.sizeBytes ?? null,
      uploaded_by: session.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

// ── Messages ───────────────────────────────────────────────────────────────

export type PortalThread = {
  id: string;
  title: string;
  updatedAt: string;
};

export type PortalMessage = {
  id: string;
  role: "client" | "staff";
  content: string;
  createdAt: string;
  authorUserId: string | null;
};

export const listMessageThreads = createServerFn({ method: "GET" }).handler(
  async (): Promise<PortalThread[]> => {
    const { client, companyId } = await requireCompanyContext();
    const { data, error } = await client
      .from("message_threads")
      .select("id, title, updated_at")
      .eq("company_id", companyId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      id: r.id as string,
      title: r.title as string,
      updatedAt: r.updated_at as string,
    }));
  },
);

export const createMessageThread = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      title: z.string().min(1).max(200),
      firstMessage: z.string().min(1).max(8000),
    }),
  )
  .handler(async ({ data }) => {
    const { session, client, companyId } = await requireCompanyContext();
    const { data: thread, error } = await client
      .from("message_threads")
      .insert({
        company_id: companyId,
        title: data.title.trim(),
        created_by: session.userId,
      })
      .select("id")
      .single();
    if (error || !thread) throw new Error(error?.message ?? "Failed to create thread");
    const { error: msgErr } = await client.from("message_messages").insert({
      thread_id: thread.id,
      author_user_id: session.userId,
      role: "client",
      content: data.firstMessage.trim(),
    });
    if (msgErr) throw new Error(msgErr.message);
    return { id: thread.id as string };
  });

export const listThreadMessages = createServerFn({ method: "GET" })
  .inputValidator(z.object({ threadId: z.string().uuid() }))
  .handler(async ({ data }): Promise<PortalMessage[]> => {
    const { client } = await requireCompanyContext();
    const { data: rows, error } = await client
      .from("message_messages")
      .select("id, role, content, created_at, author_user_id")
      .eq("thread_id", data.threadId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r) => ({
      id: r.id as string,
      role: r.role as "client" | "staff",
      content: r.content as string,
      createdAt: r.created_at as string,
      authorUserId: (r.author_user_id as string | null) ?? null,
    }));
  });

export const sendThreadMessage = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      threadId: z.string().uuid(),
      content: z.string().min(1).max(8000),
    }),
  )
  .handler(async ({ data }) => {
    const { session, client } = await requireCompanyContext();
    const { error } = await client.from("message_messages").insert({
      thread_id: data.threadId,
      author_user_id: session.userId,
      role: "client",
      content: data.content.trim(),
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

// ── Meetings ───────────────────────────────────────────────────────────────

export type PortalMeeting = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  joinUrl: string | null;
  status: string;
};

export const listPortalMeetings = createServerFn({ method: "GET" }).handler(
  async (): Promise<PortalMeeting[]> => {
    const { client, companyId } = await requireCompanyContext();
    const { data, error } = await client
      .from("portal_meetings")
      .select("id, title, starts_at, ends_at, join_url, status")
      .eq("company_id", companyId)
      .order("starts_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      id: r.id as string,
      title: r.title as string,
      startsAt: r.starts_at as string,
      endsAt: (r.ends_at as string | null) ?? null,
      joinUrl: (r.join_url as string | null) ?? null,
      status: r.status as string,
    }));
  },
);

export const requestPortalMeeting = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      title: z.string().min(1).max(200),
      startsAt: z.string().min(1),
      notes: z.string().max(2000).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { session, client, companyId } = await requireCompanyContext();
    const title = data.notes?.trim()
      ? `${data.title.trim()} — ${data.notes.trim().slice(0, 80)}`
      : data.title.trim();
    const { error } = await client.from("portal_meetings").insert({
      company_id: companyId,
      title,
      starts_at: data.startsAt,
      status: "scheduled",
      created_by: session.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

// ── Support (tickets) ──────────────────────────────────────────────────────

export type SupportTicket = {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
};

export const listSupportTickets = createServerFn({ method: "GET" }).handler(
  async (): Promise<SupportTicket[]> => {
    const { client, companyId, role, flags } = await requireCompanyContext();
    if (!flags.supportAllowed && !isCompanyAdmin(role)) {
      throw new Error("Support module not enabled for your account");
    }
    const { data, error } = await client
      .from("support_threads")
      .select("id, title, updated_at, created_at")
      .eq("company_id", companyId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      id: r.id as string,
      title: r.title as string,
      updatedAt: r.updated_at as string,
      createdAt: r.created_at as string,
    }));
  },
);

export const createSupportTicket = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      title: z.string().min(1).max(200),
      firstMessage: z.string().min(1).max(8000),
    }),
  )
  .handler(async ({ data }) => {
    const { session, client, companyId, role, flags } = await requireCompanyContext();
    if (!flags.supportAllowed && !isCompanyAdmin(role)) {
      throw new Error("Support module not enabled for your account");
    }
    const { data: thread, error } = await client
      .from("support_threads")
      .insert({
        company_id: companyId,
        title: data.title.trim(),
        created_by: session.userId,
      })
      .select("id")
      .single();
    if (error || !thread) throw new Error(error?.message ?? "Failed to open ticket");
    await client.from("support_thread_participants").upsert({
      thread_id: thread.id,
      user_id: session.userId,
    });
    const { error: msgErr } = await client.from("support_messages").insert({
      thread_id: thread.id,
      author_user_id: session.userId,
      role: "client",
      content: data.firstMessage.trim(),
    });
    if (msgErr) throw new Error(msgErr.message);
    return { id: thread.id as string };
  });

export const listSupportMessages = createServerFn({ method: "GET" })
  .inputValidator(z.object({ threadId: z.string().uuid() }))
  .handler(async ({ data }): Promise<PortalMessage[]> => {
    const { client, role, flags } = await requireCompanyContext();
    if (!flags.supportAllowed && !isCompanyAdmin(role)) {
      throw new Error("Support module not enabled for your account");
    }
    const { data: rows, error } = await client
      .from("support_messages")
      .select("id, role, content, created_at, author_user_id")
      .eq("thread_id", data.threadId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r) => ({
      id: r.id as string,
      role: r.role as "client" | "staff",
      content: r.content as string,
      createdAt: r.created_at as string,
      authorUserId: (r.author_user_id as string | null) ?? null,
    }));
  });

export const sendSupportMessage = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      threadId: z.string().uuid(),
      content: z.string().min(1).max(8000),
    }),
  )
  .handler(async ({ data }) => {
    const { session, client, role, flags } = await requireCompanyContext();
    if (!flags.supportAllowed && !isCompanyAdmin(role)) {
      throw new Error("Support module not enabled for your account");
    }
    const { error } = await client.from("support_messages").insert({
      thread_id: data.threadId,
      author_user_id: session.userId,
      role: "client",
      content: data.content.trim(),
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

// ── Authorizations ─────────────────────────────────────────────────────────

export type AuthProject = {
  id: string;
  title: string;
  deviceLimit: number | null;
  accessOverride: "allowed" | "blocked" | null;
  deviceCount: number;
};

export type AuthDevice = {
  id: string;
  projectId: string;
  name: string;
  deviceId: string;
  status: string;
  isAdminDevice: boolean;
  createdAt: string;
};

export const listAuthorizations = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ projects: AuthProject[]; devices: AuthDevice[] }> => {
    const { client, companyId, role, flags } = await requireCompanyContext();
    if (!flags.authorizationsAllowed && !isCompanyAdmin(role)) {
      throw new Error("Authorizations module not enabled for your account");
    }
    const { data: projects, error } = await client
      .from("projects")
      .select("id, title, device_limit, access_override")
      .eq("company_id", companyId)
      .order("title", { ascending: true });
    if (error) throw new Error(error.message);
    const ids = (projects ?? []).map((p) => p.id as string);
    let devices: AuthDevice[] = [];
    if (ids.length) {
      const { data: rows, error: dErr } = await client
        .from("project_auth_devices")
        .select("id, project_id, name, device_id, status, is_admin_device, created_at")
        .in("project_id", ids)
        .order("created_at", { ascending: false });
      if (dErr) throw new Error(dErr.message);
      devices = (rows ?? []).map((r) => ({
        id: r.id as string,
        projectId: r.project_id as string,
        name: r.name as string,
        deviceId: r.device_id as string,
        status: r.status as string,
        isAdminDevice: Boolean(r.is_admin_device),
        createdAt: r.created_at as string,
      }));
    }
    const countByProject = new Map<string, number>();
    for (const d of devices) {
      countByProject.set(d.projectId, (countByProject.get(d.projectId) ?? 0) + 1);
    }
    return {
      projects: (projects ?? []).map((p) => ({
        id: p.id as string,
        title: p.title as string,
        deviceLimit: (p.device_limit as number | null) ?? null,
        accessOverride: (p.access_override as "allowed" | "blocked" | null) ?? null,
        deviceCount: countByProject.get(p.id as string) ?? 0,
      })),
      devices,
    };
  },
);

export const updateProjectAccess = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      projectId: z.string().uuid(),
      deviceLimit: z.number().int().min(0).nullable().optional(),
      accessOverride: z.enum(["allowed", "blocked"]).nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { client, role, flags } = await requireCompanyContext();
    if (!flags.authorizationsAllowed && !isCompanyAdmin(role)) {
      throw new Error("Authorizations module not enabled for your account");
    }
    const patch: Record<string, unknown> = {};
    if (data.deviceLimit !== undefined) patch.device_limit = data.deviceLimit;
    if (data.accessOverride !== undefined) patch.access_override = data.accessOverride;
    const { error } = await client.from("projects").update(patch).eq("id", data.projectId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const createAuthDevice = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      projectId: z.string().uuid(),
      name: z.string().min(1).max(120),
    }),
  )
  .handler(async ({ data }) => {
    const { session, client, role, flags } = await requireCompanyContext();
    if (!flags.authorizationsAllowed && !isCompanyAdmin(role)) {
      throw new Error("Authorizations module not enabled for your account");
    }
    const { error } = await client.from("project_auth_devices").insert({
      project_id: data.projectId,
      name: data.name.trim(),
      status: "active",
      created_by: session.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const setAuthDeviceStatus = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      deviceId: z.string().uuid(),
      status: z.enum(["active", "paused", "pending"]),
    }),
  )
  .handler(async ({ data }) => {
    const { client, role, flags } = await requireCompanyContext();
    if (!flags.authorizationsAllowed && !isCompanyAdmin(role)) {
      throw new Error("Authorizations module not enabled for your account");
    }
    const { error } = await client
      .from("project_auth_devices")
      .update({ status: data.status })
      .eq("id", data.deviceId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteAuthDevice = createServerFn({ method: "POST" })
  .inputValidator(z.object({ deviceId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { client, role, flags } = await requireCompanyContext();
    if (!flags.authorizationsAllowed && !isCompanyAdmin(role)) {
      throw new Error("Authorizations module not enabled for your account");
    }
    const { error } = await client.from("project_auth_devices").delete().eq("id", data.deviceId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

// ── Program logs ───────────────────────────────────────────────────────────

export type ProgramLog = {
  id: string;
  projectId: string;
  level: string;
  message: string;
  createdAt: string;
};

export const listProgramLogs = createServerFn({ method: "GET" }).handler(
  async (): Promise<ProgramLog[]> => {
    const { client, companyId, role, flags } = await requireCompanyContext();
    if (!flags.programLogsAllowed && !isCompanyAdmin(role)) {
      throw new Error("Logs module not enabled for your account");
    }
    const { data: projects, error: pErr } = await client
      .from("projects")
      .select("id")
      .eq("company_id", companyId);
    if (pErr) throw new Error(pErr.message);
    const ids = (projects ?? []).map((p) => p.id as string);
    if (!ids.length) return [];
    const { data: rows, error } = await client
      .from("project_program_logs")
      .select("id, project_id, level, message, created_at")
      .in("project_id", ids)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r) => ({
      id: r.id as string,
      projectId: r.project_id as string,
      level: r.level as string,
      message: r.message as string,
      createdAt: r.created_at as string,
    }));
  },
);

// ── Signatures ─────────────────────────────────────────────────────────────

export type SignatureRequest = {
  id: string;
  title: string;
  status: string;
  publicToken: string;
  createdAt: string;
};

export const listSignatureRequests = createServerFn({ method: "GET" }).handler(
  async (): Promise<SignatureRequest[]> => {
    const { client, companyId, role } = await requireCompanyContext();
    if (!isCompanyAdmin(role)) throw new Error("Signatures require company admin");
    const { data, error } = await client
      .from("pdf_signature_requests")
      .select("id, title, status, public_token, created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      id: r.id as string,
      title: r.title as string,
      status: r.status as string,
      publicToken: r.public_token as string,
      createdAt: r.created_at as string,
    }));
  },
);

export const createSignatureRequest = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      title: z.string().min(1).max(200),
    }),
  )
  .handler(async ({ data }) => {
    const { session, client, companyId, role } = await requireCompanyContext();
    if (!isCompanyAdmin(role)) throw new Error("Signatures require company admin");
    const { data: row, error } = await client
      .from("pdf_signature_requests")
      .insert({
        company_id: companyId,
        title: data.title.trim(),
        status: "draft",
        created_by: session.userId,
      })
      .select("id, public_token")
      .single();
    if (error || !row) throw new Error(error?.message ?? "Failed to create request");
    return { id: row.id as string, publicToken: row.public_token as string };
  });

export const setSignatureStatus = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      requestId: z.string().uuid(),
      status: z.enum(["draft", "sent", "completed", "cancelled"]),
    }),
  )
  .handler(async ({ data }) => {
    const { client, role } = await requireCompanyContext();
    if (!isCompanyAdmin(role)) throw new Error("Signatures require company admin");
    const { error } = await client
      .from("pdf_signature_requests")
      .update({ status: data.status })
      .eq("id", data.requestId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

// ── Company users (portal admins) ──────────────────────────────────────────

export type PortalCompanyUser = {
  userId: string;
  email: string | null;
  displayName: string | null;
  role: PortalRole;
  modules: CompanyModuleFlags;
};

export const listPortalCompanyUsers = createServerFn({ method: "GET" }).handler(
  async (): Promise<PortalCompanyUser[]> => {
    const { client, companyId, role } = await requireCompanyContext();
    if (!isCompanyAdmin(role)) throw new Error("Only company admins can manage users");
    const { data: rows, error } = await client
      .from("company_members")
      .select(
        "user_id, role, authorizations_allowed, program_logs_allowed, files_allowed, support_allowed, all_projects_access",
      )
      .eq("company_id", companyId);
    if (error) throw new Error(error.message);
    if (!rows?.length) return [];
    const ids = rows.map((r) => r.user_id as string);
    const { data: profiles, error: pErr } = await client
      .from("profiles")
      .select("id, email, display_name")
      .in("id", ids);
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
      const p = byId.get(r.user_id as string);
      return {
        userId: r.user_id as string,
        email: p?.email ?? null,
        displayName: p?.displayName ?? null,
        role: r.role as PortalRole,
        modules: {
          authorizationsAllowed: Boolean(r.authorizations_allowed),
          programLogsAllowed: Boolean(r.program_logs_allowed),
          filesAllowed: Boolean(r.files_allowed),
          supportAllowed: Boolean(r.support_allowed),
          allProjectsAccess: Boolean(r.all_projects_access),
        },
      };
    });
  },
);

export const updatePortalMemberModules = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
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
    const { client, companyId, role } = await requireCompanyContext();
    if (!isCompanyAdmin(role)) throw new Error("Only company admins can manage users");
    const patch: Record<string, unknown> = {};
    if (data.role !== undefined) patch.role = data.role;
    if (data.authorizationsAllowed !== undefined)
      patch.authorizations_allowed = data.authorizationsAllowed;
    if (data.programLogsAllowed !== undefined) patch.program_logs_allowed = data.programLogsAllowed;
    if (data.filesAllowed !== undefined) patch.files_allowed = data.filesAllowed;
    if (data.supportAllowed !== undefined) patch.support_allowed = data.supportAllowed;
    if (data.allProjectsAccess !== undefined) patch.all_projects_access = data.allProjectsAccess;
    const { error } = await client
      .from("company_members")
      .update(patch)
      .eq("company_id", companyId)
      .eq("user_id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
