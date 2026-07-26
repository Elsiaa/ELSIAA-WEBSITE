/**
 * Mail schema readiness — tables come from Supabase SQL bootstrap (0003).
 * Runtime DDL via service role is a last resort for local/dev only.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getSupabaseServiceClient,
  supabasePublishableConfigured,
  supabaseSecretConfigured,
} from "../portal/supabase";

export function mailDatabaseReady(): boolean {
  return supabasePublishableConfigured() || supabaseSecretConfigured();
}

export async function ensureMailSchema(): Promise<boolean> {
  // Prefer tables created by pasting 0003_supabase_rls_bootstrap.sql.
  // Secret client can verify connectivity; we do not auto-create from app code
  // so RLS policies stay under your SQL review.
  if (!mailDatabaseReady()) return false;
  return true;
}

export async function mailTablesReachable(
  client: SupabaseClient,
): Promise<boolean> {
  const { error } = await client.from("mail_api_keys").select("id").limit(1);
  if (!error) return true;
  // Empty table or RLS deny still means table exists for service role
  if (error.code === "PGRST116") return true;
  if (error.message?.includes("does not exist")) return false;
  // 42P01 etc.
  return error.code !== "42P01";
}

/** Secret client for scoped API paths only. */
export function requireMailServiceClient(): SupabaseClient {
  const client = getSupabaseServiceClient();
  if (!client) {
    throw new Error("SUPABASE_SECRET_KEY is required for scoped mail API");
  }
  return client;
}
