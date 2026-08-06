import { isSuperAdminEmail } from "@/lib/super-admin";
import { normalizeEmailForAuth } from "@/lib/email-normalize";
import { getUserByEmailNormalized, updateUser } from "@/lib/users";
import type { UpdateUserInput } from "@/types/company";
import { isPlatformSupportAgent } from "@/lib/platform-role";

/**
 * After successful Auth.js sign-in: link `public.users.auth_user_id` and activate pending invites.
 */
export async function linkAppUserOnSignIn(params: {
  authUserId: string;
  email: string | null | undefined;
  name?: string | null;
}): Promise<void> {
  const email = normalizeEmailForAuth(params.email ?? "");
  if (!email) return;
  if (isSuperAdminEmail(email)) return;

  const appUser = await getUserByEmailNormalized(email);
  if (!appUser) return;

  const updates: UpdateUserInput = { auth_user_id: params.authUserId };

  if (appUser.status === "pending") {
    updates.status = "active";
    if (params.name?.trim()) {
      const parts = params.name.trim().split(/\s+/);
      updates.first_name = parts[0] || appUser.first_name;
      updates.last_name = parts.length > 1 ? parts.slice(1).join(" ") : appUser.last_name;
    }
    // Invited workspace users should see company projects unless explicitly scoped (support agents stay scoped in admin).
    if (!isPlatformSupportAgent(appUser.platform_role)) {
      updates.all_projects_access = true;
    }
  }

  await updateUser(appUser.id, updates);
}
