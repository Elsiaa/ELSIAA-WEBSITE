import { getServerSupabaseClient } from "./supabase";

/**
 * Ensure a Poel-compatible `public.users` row exists for this Auth user,
 * syncing company membership + module flags from `company_members` when present.
 */
export async function ensurePoelUserRow(input: {
  authUserId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}): Promise<void> {
  let supabase;
  try {
    supabase = getServerSupabaseClient();
  } catch {
    return;
  }

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("auth_user_id", input.authUserId)
    .maybeSingle();

  const { data: membership } = await supabase
    .from("company_members")
    .select(
      "company_id, role, authorizations_allowed, program_logs_allowed, files_allowed, support_allowed, all_projects_access",
    )
    .eq("user_id", input.authUserId)
    .limit(1)
    .maybeSingle();

  const role = membership?.role === "owner" || membership?.role === "admin" ? "admin" : "member";
  const elevated = role === "admin";

  const row = {
    auth_user_id: input.authUserId,
    email: input.email.trim().toLowerCase(),
    first_name: input.firstName ?? null,
    last_name: input.lastName ?? null,
    company_id: (membership?.company_id as string | undefined) ?? null,
    role,
    status: "active",
    platform_role: "none",
    all_projects_access: Boolean(membership?.all_projects_access ?? elevated),
    authorizations_allowed: Boolean(membership?.authorizations_allowed ?? elevated),
    program_logs_allowed: Boolean(membership?.program_logs_allowed ?? elevated),
    files_allowed: Boolean(membership?.files_allowed ?? elevated),
    support_allowed: Boolean(membership?.support_allowed ?? elevated),
    is_active: true,
  };

  if (existing?.id) {
    await supabase.from("users").update(row).eq("id", existing.id);
  } else {
    await supabase.from("users").insert(row);
  }
}
