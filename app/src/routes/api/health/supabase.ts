import { createFileRoute } from "@tanstack/react-router";
import { serverPortalEnv } from "../../../lib/portal/env.server";

/**
 * Public config probe — booleans + lengths only, never secret values.
 * Used to verify Vercel runtime env reaches the Bun/Nitro server.
 */
export const Route = createFileRoute("/api/health/supabase")({
  server: {
    handlers: {
      GET: async () => {
        const e = serverPortalEnv();
        const body = {
          ok: Boolean(e.supabaseUrl && e.supabaseAnonKey),
          supabaseUrl: Boolean(e.supabaseUrl),
          supabaseUrlLen: e.supabaseUrl?.length ?? 0,
          publishableKey: Boolean(e.supabaseAnonKey),
          publishableKeyLen: e.supabaseAnonKey?.length ?? 0,
          publishableKeyPrefix: e.supabaseAnonKey?.slice(0, 14) ?? null,
          secretKey: Boolean(e.supabaseServiceRoleKey),
          secretKeyLen: e.supabaseServiceRoleKey?.length ?? 0,
          secretKeyPrefix: e.supabaseServiceRoleKey?.slice(0, 12) ?? null,
          authSecret: Boolean(e.authSecret),
          superAdminEmails: e.superAdminEmails.length,
        };
        return Response.json(body);
      },
    },
  },
});
