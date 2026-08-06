import { authPool } from "@/lib/auth-pool";
import { normalizeEmailForAuth } from "@/lib/email-normalize";
import { getSupabaseAuthUserIdForEmail } from "@/lib/supabase-auth-lookup";

/**
 * Returns an Auth user id when an account exists for this email.
 * Prefers Supabase Auth (ELSIAA portal); falls back to legacy Auth.js `next_auth.users`.
 */
export async function getNextAuthUserIdForEmail(email: string): Promise<string | null> {
  const normalized = normalizeEmailForAuth(email);
  if (!normalized) return null;

  const supabaseId = await getSupabaseAuthUserIdForEmail(normalized);
  if (supabaseId) return supabaseId;

  try {
    const r = await authPool.query(
      "SELECT id FROM next_auth.users WHERE lower(trim(email)) = $1 LIMIT 1",
      [normalized],
    );
    return (r.rows[0]?.id as string) ?? null;
  } catch (e) {
    console.error("getNextAuthUserIdForEmail:", e);
    return null;
  }
}
