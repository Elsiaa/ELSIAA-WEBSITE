/**
 * Look up an existing Supabase Auth user id by email (service role).
 */

import { portalEnv } from "@/lib/portal/env";
import { normalizeEmailForAuth } from "@/lib/email-normalize";

export async function getSupabaseAuthUserIdForEmail(email: string): Promise<string | null> {
  const normalized = normalizeEmailForAuth(email);
  if (!normalized) return null;

  const { supabaseUrl, supabaseServiceRoleKey } = portalEnv();
  if (!supabaseUrl || !supabaseServiceRoleKey) return null;

  const url = new URL(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/admin/users`);
  url.searchParams.set("email", normalized);

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${supabaseServiceRoleKey}`,
        apikey: supabaseServiceRoleKey,
      },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as {
      users?: Array<{ id?: string; email?: string }>;
      id?: string;
      email?: string;
    };

    const users = Array.isArray(body.users)
      ? body.users
      : body.id
        ? [{ id: body.id, email: body.email }]
        : [];

    const match = users.find((u) => normalizeEmailForAuth(u.email) === normalized);
    return typeof match?.id === "string" ? match.id : null;
  } catch (e) {
    console.error("getSupabaseAuthUserIdForEmail:", e);
    return null;
  }
}
