import { createFileRoute } from "@tanstack/react-router";
import { mailMasterConfigured } from "../../../../../lib/mail/env";
import {
  extractBearer,
  verifyMailApiKey,
} from "../../../../../lib/mail/keys.server";
import {
  mailDatabaseReady,
  requireMailServiceClient,
} from "../../../../../lib/mail/schema.server";
import { executeScopedOrAdminBatch } from "../../../../../lib/mail/send.server";
import type { MailSendPayload } from "../../../../../lib/mail/types";
import { supabaseSecretConfigured } from "../../../../../lib/portal/supabase";

export const Route = createFileRoute("/api/mail/v1/send/batch")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!mailMasterConfigured()) {
          return Response.json(
            { ok: false, error: "Mail API not configured" },
            { status: 503 },
          );
        }
        if (!mailDatabaseReady() || !supabaseSecretConfigured()) {
          return Response.json(
            {
              ok: false,
              error: "SUPABASE_SECRET_KEY required for scoped mail keys",
            },
            { status: 503 },
          );
        }

        const bearer = extractBearer(request);
        const key = await verifyMailApiKey(bearer);
        if (!key) {
          return Response.json(
            { ok: false, error: "Invalid or revoked API key" },
            { status: 401 },
          );
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ ok: false, error: "bad_json" }, { status: 400 });
        }

        const messages = (body as { messages?: MailSendPayload[] })?.messages;
        if (!Array.isArray(messages) || messages.length === 0) {
          return Response.json(
            { ok: false, error: "messages array required" },
            { status: 400 },
          );
        }

        const result = await executeScopedOrAdminBatch({
          messages,
          source: "scoped_api",
          apiKey: key,
          logClient: requireMailServiceClient(),
        });

        if (!result.ok) {
          return Response.json(
            { ok: false, error: result.error },
            { status: result.status },
          );
        }
        return Response.json({ ok: true, result: result.result });
      },
    },
  },
});
