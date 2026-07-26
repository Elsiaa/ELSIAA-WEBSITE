/**
 * Portal auth helpers.
 * Super-admin UI gate: SUPER_ADMIN_EMAILS + Supabase Auth (app_metadata.role).
 * RLS: public.is_super_admin() — see migrations/0003_supabase_rls_bootstrap.sql.
 */
import { portalEnv } from "./env";

export { isSuperAdminEmail, parseSuperAdminEmails } from "../admin/super-admin";

export function portalAuthConfigured(): boolean {
  return Boolean(portalEnv().authSecret);
}
