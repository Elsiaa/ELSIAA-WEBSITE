/**
 * Scoped outbound mail API keys (hashed secrets, From allowlists).
 * Admin CRUD: user-scoped Supabase client (RLS + is_super_admin).
 * Scoped API verify: service client after emk_ auth (bypasses RLS).
 */
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isAllowedMailFrom, extractMailAddress } from "./env";
import { mailDatabaseReady, requireMailServiceClient } from "./schema.server";
import type { MailApiKeyRecord } from "./types";

type KeyRow = {
  id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  allow_any_from: boolean;
  allowed_from: string[] | null;
  enabled: boolean;
  created_at: string;
  created_by_email: string | null;
  last_used_at: string | null;
  revoked_at: string | null;
};

function hashKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

function mapKey(row: KeyRow): MailApiKeyRecord {
  return {
    id: row.id,
    name: row.name,
    keyPrefix: row.key_prefix,
    allowAnyFrom: row.allow_any_from,
    allowedFrom: row.allowed_from ?? [],
    enabled: row.enabled,
    createdAt: row.created_at,
    createdByEmail: row.created_by_email,
    lastUsedAt: row.last_used_at,
    revokedAt: row.revoked_at,
  };
}

function generateRawKey(): { raw: string; prefix: string; hash: string } {
  const secret = randomBytes(24).toString("base64url");
  const raw = `emk_${secret}`;
  const prefix = raw.slice(0, 12);
  return { raw, prefix, hash: hashKey(raw) };
}

export async function listMailApiKeys(client: SupabaseClient): Promise<MailApiKeyRecord[]> {
  const { data, error } = await client
    .from("mail_api_keys")
    .select(
      "id, name, key_prefix, key_hash, allow_any_from, allowed_from, enabled, created_at, created_by_email, last_used_at, revoked_at",
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as KeyRow[] | null)?.map(mapKey) ?? [];
}

export async function createMailApiKey(
  client: SupabaseClient,
  input: {
    name: string;
    allowAnyFrom?: boolean;
    allowedFrom?: string[];
    createdByEmail?: string | null;
  },
): Promise<{ key: MailApiKeyRecord; rawKey: string }> {
  if (!mailDatabaseReady()) {
    throw new Error("Supabase is required for mail API keys");
  }
  const allowAnyFrom = Boolean(input.allowAnyFrom);
  const allowedFrom = (input.allowedFrom ?? []).map((e) => e.trim().toLowerCase()).filter(Boolean);
  for (const addr of allowedFrom) {
    if (!isAllowedMailFrom(addr)) {
      throw new Error(`From address not on allowed domains: ${addr}`);
    }
  }
  if (!allowAnyFrom && allowedFrom.length === 0) {
    throw new Error("Add at least one allowed From address, or enable free-for-all");
  }
  const { raw, prefix, hash } = generateRawKey();
  const { data, error } = await client
    .from("mail_api_keys")
    .insert({
      name: input.name.trim(),
      key_prefix: prefix,
      key_hash: hash,
      allow_any_from: allowAnyFrom,
      allowed_from: allowedFrom,
      created_by_email: input.createdByEmail?.trim().toLowerCase() ?? null,
    })
    .select(
      "id, name, key_prefix, key_hash, allow_any_from, allowed_from, enabled, created_at, created_by_email, last_used_at, revoked_at",
    )
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create mail API key");
  return { key: mapKey(data as KeyRow), rawKey: raw };
}

export async function updateMailApiKey(
  client: SupabaseClient,
  input: {
    id: string;
    name?: string;
    allowAnyFrom?: boolean;
    allowedFrom?: string[];
    enabled?: boolean;
  },
): Promise<MailApiKeyRecord | null> {
  const allowedFrom = input.allowedFrom?.map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (allowedFrom) {
    for (const addr of allowedFrom) {
      if (!isAllowedMailFrom(addr)) {
        throw new Error(`From address not on allowed domains: ${addr}`);
      }
    }
  }
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.allowAnyFrom !== undefined) patch.allow_any_from = input.allowAnyFrom;
  if (allowedFrom !== undefined) patch.allowed_from = allowedFrom;
  if (input.enabled !== undefined) patch.enabled = input.enabled;

  const { data, error } = await client
    .from("mail_api_keys")
    .update(patch)
    .eq("id", input.id)
    .is("revoked_at", null)
    .select(
      "id, name, key_prefix, key_hash, allow_any_from, allowed_from, enabled, created_at, created_by_email, last_used_at, revoked_at",
    )
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapKey(data as KeyRow) : null;
}

export async function revokeMailApiKey(client: SupabaseClient, id: string): Promise<boolean> {
  const { data, error } = await client
    .from("mail_api_keys")
    .update({ revoked_at: new Date().toISOString(), enabled: false })
    .eq("id", id)
    .is("revoked_at", null)
    .select("id");
  if (error) throw new Error(error.message);
  return (data?.length ?? 0) > 0;
}

export type VerifiedMailApiKey = MailApiKeyRecord & { keyHash: string };

export async function verifyMailApiKey(
  bearer: string | null | undefined,
): Promise<VerifiedMailApiKey | null> {
  if (!bearer?.startsWith("emk_")) return null;
  if (!mailDatabaseReady()) return null;
  let client: SupabaseClient;
  try {
    client = requireMailServiceClient();
  } catch {
    return null;
  }
  const prefix = bearer.slice(0, 12);
  const { data, error } = await client
    .from("mail_api_keys")
    .select(
      "id, name, key_prefix, key_hash, allow_any_from, allowed_from, enabled, created_at, created_by_email, last_used_at, revoked_at",
    )
    .eq("key_prefix", prefix)
    .eq("enabled", true)
    .is("revoked_at", null);
  if (error) return null;
  const rows = (data as KeyRow[] | null) ?? [];
  const hash = hashKey(bearer);
  const match = rows.find((r) => safeEqualHex(r.key_hash, hash));
  if (!match) return null;
  void client
    .from("mail_api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", match.id)
    .then(() => undefined);
  return { ...mapKey(match), keyHash: match.key_hash };
}

export function assertFromAllowedForKey(
  key: Pick<MailApiKeyRecord, "allowAnyFrom" | "allowedFrom">,
  from: string,
): string | null {
  const normalized = extractMailAddress(from);
  if (!isAllowedMailFrom(normalized)) {
    return `From must be @elsiaa.com (got ${from})`;
  }
  if (key.allowAnyFrom) return null;
  const allowed = key.allowedFrom.map((a) => extractMailAddress(a));
  if (!allowed.includes(normalized)) {
    return `From address not authorized for this API key: ${from}`;
  }
  return null;
}

export function extractBearer(request: Request): string | null {
  const h = request.headers.get("authorization");
  if (!h) return null;
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  return m?.[1]?.trim() ?? null;
}
