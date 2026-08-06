import { getServerSupabaseClient } from "@/lib/supabase";
import type { ChatMessage } from "@/lib/chat";
import { sendTransactionalMail } from "@/lib/transactional-mail";
import { normalizeEmailForAuth } from "@/lib/email-normalize";
import { getUsersByCompany, getUserByAuthUserId } from "@/lib/users";
import { isUserIdSuperAdmin } from "@/lib/permissions";
import {
  listSupportDeskAgentUserIdsForCompany,
  supportAgentHasCompanyGrant,
} from "@/lib/support-agent-grants";
import type { User } from "@/types/company";
import { isPlatformSupportAgent } from "@/lib/platform-role";
import { companyUserHasModule } from "@/lib/company-user-modules";
import {
  parseSupportAttachmentsColumn,
  supportRowToMessage,
  type SupportMessageRow,
} from "@/lib/support-client";
import { deleteChatFile } from "@/lib/chat";
import {
  buildSupportNotificationHtml,
  buildSupportNotificationPlainText,
  sliceHistoryForNotify,
} from "@/lib/support-notification-email";

export type { SupportMessageRow } from "@/lib/support-client";
export { supportRowToMessage, getSupportMessagesClient } from "@/lib/support-client";

export type SupportThreadRow = {
  id: string;
  company_id: string;
  title: string;
  created_by_auth_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export async function getSupportThreadById(threadId: string): Promise<SupportThreadRow | null> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from("support_threads")
    .select("*")
    .eq("id", threadId)
    .maybeSingle();

  if (error || !data) return null;
  return data as SupportThreadRow;
}

export async function isUserParticipant(threadId: string, appUserId: string): Promise<boolean> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from("support_thread_participants")
    .select("user_id")
    .eq("thread_id", threadId)
    .eq("user_id", appUserId)
    .maybeSingle();

  if (error) return false;
  return Boolean(data);
}

export async function listParticipantUserIds(threadId: string): Promise<string[]> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from("support_thread_participants")
    .select("user_id")
    .eq("thread_id", threadId);

  if (error || !data) return [];
  return data.map((r) => r.user_id as string);
}

/** Whether the actor may read/post in this thread (API authorization). */
export async function canAccessSupportThread(
  thread: SupportThreadRow,
  opts: {
    isSuperAdmin: boolean;
    appUser: User | null;
    authUserId: string;
  },
): Promise<boolean> {
  if (opts.isSuperAdmin) return true;
  if (!opts.appUser) return false;
  if (
    companyUserHasModule(opts.appUser, "support") &&
    opts.appUser.company_id === thread.company_id
  ) {
    return true;
  }
  if (
    isPlatformSupportAgent(opts.appUser.platform_role) &&
    (await supportAgentHasCompanyGrant(opts.appUser.id, thread.company_id, "support"))
  ) {
    return true;
  }
  return isUserParticipant(thread.id, opts.appUser.id);
}

export async function canManageSupportThread(
  thread: SupportThreadRow,
  opts: { isSuperAdmin: boolean; appUser: User | null },
): Promise<boolean> {
  if (opts.isSuperAdmin) return true;
  if (!opts.appUser) return false;
  if (
    companyUserHasModule(opts.appUser, "support") &&
    opts.appUser.company_id === thread.company_id
  ) {
    return true;
  }
  if (
    isPlatformSupportAgent(opts.appUser.platform_role) &&
    (await supportAgentHasCompanyGrant(opts.appUser.id, thread.company_id, "support"))
  ) {
    return true;
  }
  return false;
}

export async function listSupportThreadsForCompany(companyId: string): Promise<SupportThreadRow[]> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from("support_threads")
    .select("*")
    .eq("company_id", companyId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("listSupportThreadsForCompany", error);
    return [];
  }
  return (data || []) as SupportThreadRow[];
}

export async function listSupportThreadsForParticipant(
  appUserId: string,
): Promise<SupportThreadRow[]> {
  const supabase = getServerSupabaseClient();
  const { data: parts, error: pErr } = await supabase
    .from("support_thread_participants")
    .select("thread_id")
    .eq("user_id", appUserId);

  if (pErr || !parts?.length) return [];

  const threadIds = [...new Set(parts.map((p) => p.thread_id as string))];
  const { data, error } = await supabase
    .from("support_threads")
    .select("*")
    .in("id", threadIds)
    .order("updated_at", { ascending: false });

  if (error) return [];
  return (data || []) as SupportThreadRow[];
}

export async function getSupportMessages(threadId: string): Promise<ChatMessage[]> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from("support_messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getSupportMessages", error);
    return [];
  }
  return (data || []).map((row) => supportRowToMessage(row as SupportMessageRow));
}

export async function addSupportMessage(
  threadId: string,
  message: Omit<ChatMessage, "id" | "timestamp">,
): Promise<ChatMessage> {
  const supabase = getServerSupabaseClient();
  const timestamp = Date.now();
  const row = {
    thread_id: threadId,
    role: "user" as const,
    content: JSON.stringify({
      userId: message.userId,
      userName: message.userName,
      message: message.message,
      timestamp,
    }),
    attachments: message.attachments || [],
  };

  const { data, error } = await supabase.from("support_messages").insert(row).select().single();

  if (error) {
    console.error("addSupportMessage", error);
    throw new Error(`Failed to add message: ${error.message}`);
  }

  return supportRowToMessage(data as SupportMessageRow);
}

export async function createSupportThread(input: {
  companyId: string;
  title: string;
  createdByAuthUserId: string;
  participantUserIds: string[];
}): Promise<SupportThreadRow> {
  const supabase = getServerSupabaseClient();

  const { data: thread, error: tErr } = await supabase
    .from("support_threads")
    .insert({
      company_id: input.companyId,
      title: input.title.trim(),
      created_by_auth_user_id: input.createdByAuthUserId,
    })
    .select()
    .single();

  if (tErr || !thread) {
    console.error("createSupportThread", tErr);
    throw new Error(tErr?.message || "Failed to create thread");
  }

  const rows = input.participantUserIds.map((user_id) => ({
    thread_id: thread.id,
    user_id,
  }));

  if (rows.length > 0) {
    const { error: pErr } = await supabase.from("support_thread_participants").insert(rows);
    if (pErr) {
      console.error("createSupportThread participants", pErr);
      await supabase.from("support_threads").delete().eq("id", thread.id);
      throw new Error(pErr.message);
    }
  }

  return thread as SupportThreadRow;
}

export async function replaceSupportThreadParticipants(
  threadId: string,
  userIds: string[],
): Promise<void> {
  const supabase = getServerSupabaseClient();
  const { error: delErr } = await supabase
    .from("support_thread_participants")
    .delete()
    .eq("thread_id", threadId);

  if (delErr) {
    throw new Error(delErr.message);
  }

  const unique = [...new Set(userIds)];
  if (unique.length === 0) return;

  const rows = unique.map((user_id) => ({ thread_id: threadId, user_id }));
  const { error: insErr } = await supabase.from("support_thread_participants").insert(rows);
  if (insErr) {
    throw new Error(insErr.message);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function superAdminRecipientEmailsRaw(excludeNormalizedSender: string): string[] {
  const raw = process.env.SUPER_ADMIN_EMAILS || "";
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (normalizeEmailForAuth(trimmed) !== excludeNormalizedSender) {
      out.push(trimmed);
    }
  }
  return out;
}

/** Logs recipient resolution for `notifySupportMessageRecipients`. Set `SUPPORT_NOTIFY_DEBUG=1` on the server, or run with `NODE_ENV=development`. */
function supportNotifyDebugEnabled(): boolean {
  const v = process.env.SUPPORT_NOTIFY_DEBUG;
  if (v === "1" || v === "true") return true;
  return process.env.NODE_ENV === "development";
}

export async function notifySupportMessageRecipients(input: {
  threadId: string;
  companyId: string;
  threadTitle: string;
  companyName: string;
  message: ChatMessage;
  senderAuthUserId: string;
  senderEmail: string | null | undefined;
}): Promise<void> {
  const debug = supportNotifyDebugEnabled();
  const log = (...args: unknown[]) => {
    if (debug) console.info("[support-notify]", ...args);
  };

  const supabase = getServerSupabaseClient();
  const { data: parts } = await supabase
    .from("support_thread_participants")
    .select("user_id")
    .eq("thread_id", input.threadId);

  const participantUserIds = new Set<string>();
  for (const p of parts || []) {
    participantUserIds.add(p.user_id as string);
  }

  const supportAgentUserIdsList = await listSupportDeskAgentUserIdsForCompany(input.companyId);
  const supportAgentUserIds = new Set(supportAgentUserIdsList);

  const companyUsers = await getUsersByCompany(input.companyId);
  const companyAdminUserIds = new Set<string>();
  for (const u of companyUsers) {
    if (u.role === "admin" || companyUserHasModule(u, "support")) companyAdminUserIds.add(u.id);
  }

  const recipientUserIds = new Set<string>();
  for (const id of participantUserIds) recipientUserIds.add(id);
  for (const id of supportAgentUserIds) recipientUserIds.add(id);
  for (const id of companyAdminUserIds) recipientUserIds.add(id);

  const senderNorm = normalizeEmailForAuth(input.senderEmail ?? "");
  const isSenderSuper = await isUserIdSuperAdmin(input.senderAuthUserId);

  log("start", {
    threadId: input.threadId,
    companyId: input.companyId,
    threadTitle: input.threadTitle,
  });
  log("buckets (user ids)", {
    participants: [...participantUserIds],
    supportAgents_support_allowed: [...supportAgentUserIds],
    companyAdmins: [...companyAdminUserIds],
    unionCount: recipientUserIds.size,
  });
  log("sender", {
    senderAuthUserId: input.senderAuthUserId,
    senderEmail: input.senderEmail ?? null,
    normalizedSenderEmail: senderNorm || "(empty — sender excluded only when normalized matches)",
    isSenderSuperAdmin: isSenderSuper,
    superAdminEnvListNote: isSenderSuper
      ? "SUPER_ADMIN_EMAILS not applied (sender is super admin)"
      : "SUPER_ADMIN_EMAILS evaluated below",
  });

  const byNorm = new Map<string, string>();

  function considerEmail(
    raw: string | null | undefined,
    meta: { kind: string; userId?: string; sources?: string },
  ): void {
    if (raw == null || !String(raw).trim()) {
      log("SKIP", { reason: "empty_or_null_email", ...meta, raw });
      return;
    }
    const trimmed = raw.trim();
    const n = normalizeEmailForAuth(trimmed);
    if (!n) {
      log("SKIP", { reason: "normalize_yielded_empty", ...meta, raw: trimmed });
      return;
    }
    if (n === senderNorm) {
      log("SKIP", {
        reason: "is_sender_same_normalized_email",
        ...meta,
        normalized: n,
        raw: trimmed,
      });
      return;
    }
    if (byNorm.has(n)) {
      log("SKIP", {
        reason: "duplicate_email_already_included",
        ...meta,
        normalized: n,
        raw: trimmed,
        keptRaw: byNorm.get(n),
      });
      return;
    }
    byNorm.set(n, trimmed);
    log("INCLUDE", { ...meta, normalized: n, raw: trimmed });
  }

  if (recipientUserIds.size > 0) {
    const { data: users, error: usersErr } = await supabase
      .from("users")
      .select("id, email")
      .in("id", [...recipientUserIds]);
    if (usersErr) {
      log("users table query error", usersErr);
    }
    const fetched = new Set((users || []).map((r) => (r as { id: string }).id));
    for (const userId of recipientUserIds) {
      if (!fetched.has(userId)) {
        log("SKIP user_id", {
          reason: "no_users_table_row_for_id",
          userId,
          hint: "id was in buckets but not returned — check DB / typo",
        });
      }
    }
    for (const row of users || []) {
      const u = row as { id: string; email: string };
      const sources: string[] = [];
      if (participantUserIds.has(u.id)) sources.push("participant");
      if (supportAgentUserIds.has(u.id)) sources.push("support_agent_grant");
      if (companyAdminUserIds.has(u.id)) sources.push("company_admin");
      considerEmail(u.email, {
        kind: "company_thread_recipient",
        userId: u.id,
        sources: sources.join(", ") || "unknown",
      });
    }
  } else {
    log("no union user ids from participants + support agents + company admins");
  }

  if (!isSenderSuper) {
    const superList = superAdminRecipientEmailsRaw(senderNorm);
    log("super_admin env list", {
      count: superList.length,
      fromEnv_SUPER_ADMIN_EMAILS: superList,
    });
    for (const addr of superList) {
      considerEmail(addr, { kind: "super_admin_env", sources: "SUPER_ADMIN_EMAILS" });
    }
  }

  const to = [...byNorm.values()];
  if (to.length === 0) {
    log("DONE — empty recipient list; NOT sending email");
    return;
  }

  log("SENDING transactional mail", { toCount: to.length, toAddresses: to });

  const threadMessages = await getSupportMessages(input.threadId);
  const { prior, newest } = sliceHistoryForNotify(threadMessages, input.message);
  const notificationPayload = {
    companyName: input.companyName,
    threadTitle: input.threadTitle,
    priorMessages: prior,
    newMessage: newest,
  };

  await sendTransactionalMail({
    to,
    subject: `You have a new message on ${input.companyName}: ${input.threadTitle}`,
    html: buildSupportNotificationHtml(notificationPayload),
    text: buildSupportNotificationPlainText(notificationPayload),
  });
  log("SENT transactional mail (provider returned ok)");
}

export async function resolveDisplayNameForSupport(
  authUserId: string,
  fallbackName: string,
  sessionEmail: string | null | undefined,
): Promise<string> {
  if (await isUserIdSuperAdmin(authUserId)) {
    return "Admin";
  }
  const u = await getUserByAuthUserId(authUserId);
  if (u) {
    const n = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
    if (n) return n;
    return u.email || fallbackName;
  }
  return sessionEmail || fallbackName;
}

export async function defaultParticipantIdsForCompany(companyId: string): Promise<string[]> {
  const users = await getUsersByCompany(companyId);
  return users.map((u) => u.id);
}

/** Remove a message only if it belongs to the given auth user; best-effort R2 cleanup for attachments. */
export async function deleteOwnSupportMessage(
  threadId: string,
  messageId: string,
  authUserId: string,
): Promise<"deleted" | "not_found" | "forbidden"> {
  const supabase = getServerSupabaseClient();
  const { data: row, error } = await supabase
    .from("support_messages")
    .select("*")
    .eq("id", messageId)
    .maybeSingle();

  if (error || !row) return "not_found";
  const typed = row as SupportMessageRow;
  if (typed.thread_id !== threadId) return "not_found";

  let content: { userId?: string };
  try {
    content = JSON.parse(typed.content) as { userId?: string };
  } catch {
    return "not_found";
  }
  if (content.userId !== authUserId) return "forbidden";

  const attachments = parseSupportAttachmentsColumn(typed.attachments);
  for (const att of attachments) {
    try {
      await deleteChatFile(att.url);
    } catch (e) {
      console.error("deleteOwnSupportMessage: deleteChatFile", e);
    }
  }

  const { error: delErr } = await supabase.from("support_messages").delete().eq("id", messageId);
  if (delErr) {
    console.error("deleteOwnSupportMessage", delErr);
    throw new Error(delErr.message);
  }
  return "deleted";
}
