// Private endpoint: ELSIAA's backend view of all quote requests.
// Requires the admin access key (x-admin-key header).
import { createFileRoute } from "@tanstack/react-router";
import { isAdmin, listQuotes, setQuoteStatus } from "../../lib/quotes.server";

export const Route = createFileRoute("/api/quotes")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isAdmin(request))
          return Response.json({ ok: false, code: "unauthorized" }, { status: 401 });
        try {
          const quotes = await listQuotes();
          return Response.json({ ok: true, quotes });
        } catch {
          return Response.json({ ok: false, code: "storage_error" }, { status: 500 });
        }
      },
      POST: async ({ request }) => {
        if (!isAdmin(request))
          return Response.json({ ok: false, code: "unauthorized" }, { status: 401 });
        try {
          const body = (await request.json()) as { id?: string; status?: string };
          if (typeof body.id === "string" && typeof body.status === "string") {
            await setQuoteStatus(body.id, body.status);
          }
          return Response.json({ ok: true });
        } catch {
          return Response.json({ ok: false, code: "storage_error" }, { status: 500 });
        }
      },
    },
  },
});
