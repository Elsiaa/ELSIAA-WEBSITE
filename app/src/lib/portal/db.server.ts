/**
 * Postgres access for the portal. Returns null until DATABASE_URL is set.
 * Server-only — import from `.server.ts` / route handlers, never the client.
 */
import pg from "pg";
import { portalEnv } from "./env";

const { Pool } = pg;

let pool: pg.Pool | null | undefined;

export function getPortalPool(): pg.Pool | null {
  if (pool !== undefined) return pool;
  const { databaseUrl, databaseSslNoVerify } = portalEnv();
  if (!databaseUrl) {
    pool = null;
    return pool;
  }
  pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseSslNoVerify ? { rejectUnauthorized: false } : undefined,
  });
  return pool;
}

export async function portalQuery<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<pg.QueryResult<T> | null> {
  const p = getPortalPool();
  if (!p) return null;
  return p.query<T>(text, params);
}
