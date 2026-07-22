// Public endpoint: request a meeting slot from the Contact Us calendar.
import { createFileRoute } from "@tanstack/react-router";
import { parseMeetingInput, storeMeeting } from "../../lib/quotes.server";

export const Route = createFileRoute("/api/meeting")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ ok: false, code: "bad_json" }, { status: 400 });
        }
        const m = parseMeetingInput(body);
        if (!m)
          return Response.json({ ok: false, code: "invalid_input" }, { status: 400 });
        try {
          const { id } = await storeMeeting(m);
          return Response.json({ ok: true, id });
        } catch {
          return Response.json({ ok: false, code: "storage_error" }, { status: 500 });
        }
      },
    },
  },
});
