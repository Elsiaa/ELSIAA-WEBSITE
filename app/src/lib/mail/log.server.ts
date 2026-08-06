/**
 * Audit log for every mail send (admin UI + scoped API).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServiceClient } from "../portal/supabase";
import { mailDatabaseReady } from "./schema.server";
import type { MailSendLogRecord, MailSendSource, MailSendStatus } from "./types";

type LogRow = {
  id: string;
  created_at: string;
  source: MailSendSource;
  api_key_id: string | null;
  from_addr: string;
  to_addrs: string[] | null;
  cc: string[] | null;
  bcc: string[] | null;
  subject: string;
  status: MailSendStatus;
  provider_response: string | null;
  error: string | null;
  mail_api_keys?: { name: string } | { name: string }[] | null;
};

function asList(v: string | string[] | undefined | null): string[] {
  if (v == null) return [];
  if (Array.isArray(v)) return v.map(String);
  return String(v)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function mapLog(row: LogRow): MailSendLogRecord {
  const keyRel = row.mail_api_keys;
  const apiKeyName = Array.isArray(keyRel) ? (keyRel[0]?.name ?? null) : (keyRel?.name ?? null);
  return {
    id: row.id,
    createdAt: row.created_at,
    source: row.source,
    apiKeyId: row.api_key_id,
    apiKeyName,
    fromAddr: row.from_addr,
    toAddrs: row.to_addrs ?? [],
    cc: row.cc ?? [],
    bcc: row.bcc ?? [],
    subject: row.subject,
    status: row.status,
    providerResponse: row.provider_response,
    error: row.error,
  };
}

export async function insertMailSendLog(
  input: {
    source: MailSendSource;
    apiKeyId?: string | null;
    from: string;
    to?: string | string[] | null;
    cc?: string | string[] | null;
    bcc?: string | string[] | null;
    subject: string;
    status: MailSendStatus;
    providerResponse?: string | null;
    error?: string | null;
  },
  client?: SupabaseClient | null,
): Promise<void> {
  if (!mailDatabaseReady()) return;
  const db = client ?? getSupabaseServiceClient();
  if (!db) return;
  const { error } = await db.from("mail_send_log").insert({
    source: input.source,
    api_key_id: input.apiKeyId ?? null,
    from_addr: input.from,
    to_addrs: asList(input.to),
    cc: asList(input.cc),
    bcc: asList(input.bcc),
    subject: input.subject.slice(0, 500),
    status: input.status,
    provider_response: input.providerResponse?.slice(0, 500) ?? null,
    error: input.error?.slice(0, 1000) ?? null,
  });
  if (error) {
    console.error("[mail_send_log]", error.message);
  }
}

export async function listMailSendLog(
  client: SupabaseClient,
  opts?: {
    limit?: number;
    source?: MailSendSource;
    apiKeyId?: string;
  },
): Promise<MailSendLogRecord[]> {
  const limit = Math.min(Math.max(opts?.limit ?? 50, 1), 200);
  let q = client
    .from("mail_send_log")
    .select(
      "id, created_at, source, api_key_id, from_addr, to_addrs, cc, bcc, subject, status, provider_response, error, mail_api_keys(name)",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (opts?.source) q = q.eq("source", opts.source);
  if (opts?.apiKeyId) q = q.eq("api_key_id", opts.apiKeyId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data as LogRow[] | null)?.map(mapLog) ?? [];
}
