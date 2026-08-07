/**
 * Stub — Poel used a next_auth Postgres pool; ELSIAA uses Supabase Auth.
 *
 * ⚠ THIS EXECUTES NO QUERIES. Every call resolves to zero rows.
 *
 * That is safe for the two auth callers, which fail closed:
 *   - permissions.ts `isUserIdSuperAdmin` → no row → not a super admin
 *   - next-auth-user-lookup.ts → tries Supabase first, this is a dead fallback
 *
 * It is NOT safe for lib/public-upload-links.ts, which is built entirely on
 * this stub. Public upload links therefore do not work at all: creating one
 * has no row to return, and looking one up always yields null, so every
 * shared upload URL 404s. The four routes under poel-api/public-upload/
 * inherit that. Porting those queries to Supabase is outstanding work.
 *
 * The generic and `rowCount` exist so callers written against the real pg
 * client type-check. They describe the shape the callers expect, not
 * behaviour this stub provides.
 */
export const authPool = {
  query: async <T = Record<string, unknown>>(
    _sql: string,
    _params?: unknown[],
  ): Promise<{ rows: T[]; rowCount: number | null }> => ({
    rows: [] as T[],
    rowCount: 0,
  }),
};
