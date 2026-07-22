// Private endpoint: list meeting requests + update status (admin key).
import { createFileRoute } from "@tanstack/react-router";
import { isAdmin, listMeetings, setMeetingStatus } from "../../lib/quotes.server";

export const Route = createFileRoute("/api/meetings")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isAdmin(request))
          return Response.json({ ok: false, code: "unauthorized" }, { status: 401 });
        try {
          return Response.json({ ok: true, meetings: await listMeetings() });
        } catch {
          return Response.json({ ok: false, code: "storage_error" }, { status: 500 });
        }
      },
      POST: async ({ request }) => {
        if (!isAdmin(request))
          return Response.json({ ok: false, code: "unauthorized" }, { status: 401 });
        try {
          const body = (await request.json()) as { id?: string; status?: string };
          if (typeof body.id === "string" && typeof body.status === "string")
            await setMeetingStatus(body.id, body.status);
          return Response.json({ ok: true });
        } catch {
          return Response.json({ ok: false, code: "storage_error" }, { status: 500 });
        }
      },
    },
  },
});
