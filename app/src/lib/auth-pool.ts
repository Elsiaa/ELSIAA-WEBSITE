/** Stub — Poel used next_auth PG pool; ELSIAA uses Supabase Auth. */
export const authPool = {
  query: async (_sql: string, _params?: unknown[]) => ({
    rows: [] as Array<Record<string, unknown>>,
  }),
};
