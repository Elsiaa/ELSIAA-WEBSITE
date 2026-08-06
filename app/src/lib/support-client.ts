/**
 * Browser-safe support helpers (no nodemailer / server-only deps).
 * Client components must import from this file, not `@/lib/support`.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChatAttachment, ChatMessage } from "@/lib/chat";

export type SupportMessageRow = {
  id: string;
  thread_id: string;
  role: string;
  content: string;
  attachments: ChatAttachment[] | unknown;
  created_at: string;
  updated_at: string;
};

/** JSONB / PostgREST sometimes returns a JSON string instead of a parsed array. */
export function parseSupportAttachmentsColumn(raw: unknown): ChatAttachment[] {
  if (Array.isArray(raw)) return raw as ChatAttachment[];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? (parsed as ChatAttachment[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function supportRowToMessage(row: SupportMessageRow): ChatMessage {
  const content = JSON.parse(row.content);
  const attachments = parseSupportAttachmentsColumn(row.attachments);
  return {
    id: row.id,
    userId: content.userId,
    userName: content.userName,
    message: content.message,
    timestamp: content.timestamp || new Date(row.created_at).getTime(),
    attachments,
  };
}

export async function getSupportMessagesClient(
  client: SupabaseClient,
  threadId: string,
): Promise<ChatMessage[]> {
  try {
    const { data, error } = await client
      .from("support_messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("getSupportMessagesClient", error);
      return [];
    }
    return (data || []).map((row) => supportRowToMessage(row as SupportMessageRow));
  } catch (e) {
    console.error(e);
    return [];
  }
}
