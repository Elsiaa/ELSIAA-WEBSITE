// Private endpoint: list merch orders + update status (admin key).
import { createFileRoute } from "@tanstack/react-router";
import { isAdmin, listOrders, setOrderStatus } from "../../lib/quotes.server";

export const Route = createFileRoute("/api/orders")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isAdmin(request))
          return Response.json({ ok: false, code: "unauthorized" }, { status: 401 });
        try {
          return Response.json({ ok: true, orders: await listOrders() });
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
            await setOrderStatus(body.id, body.status);
          return Response.json({ ok: true });
        } catch {
          return Response.json({ ok: false, code: "storage_error" }, { status: 500 });
        }
      },
    },
  },
});
