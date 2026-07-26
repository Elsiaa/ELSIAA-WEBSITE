/** Poel-compatible super-admin helpers (Set API + ELSIAA allowlist). */
import { isSuperAdminEmail as elsiaaIsSuperAdminEmail, parseSuperAdminEmails as elsiaaParse } from "./admin/super-admin";
import { normalizeEmailForAuth } from "./email-normalize";

export function parseSuperAdminEmails(): Set<string> {
  return new Set(elsiaaParse());
}

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  return elsiaaIsSuperAdminEmail(email);
}

export { normalizeEmailForAuth };
