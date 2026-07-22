// Public endpoint: a potential client submits the project questionnaire.
// Validates, composes the executive brief, stores it, returns the brief.
import { createFileRoute } from "@tanstack/react-router";
import { parseQuoteInput, storeQuote } from "../../lib/quotes.server";

export const Route = createFileRoute("/api/quote")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json(
            { ok: false, code: "bad_json" },
            { status: 400 },
          );
        }
        const q = parseQuoteInput(body);
        if (!q)
          return Response.json(
            { ok: false, code: "invalid_input" },
            { status: 400 },
          );
        try {
          const { id, summary } = await storeQuote(q);
          return Response.json({ ok: true, id, summary });
        } catch {
          return Response.json(
            { ok: false, code: "storage_error" },
            { status: 500 },
          );
        }
      },
    },
  },
});
