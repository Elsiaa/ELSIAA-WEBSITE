// Public endpoint: place a merch order request from the ELSIAA store.
import { createFileRoute } from "@tanstack/react-router";
import { parseOrderInput, storeOrder } from "../../lib/quotes.server";

export const Route = createFileRoute("/api/order")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ ok: false, code: "bad_json" }, { status: 400 });
        }
        const o = parseOrderInput(body);
        if (!o)
          return Response.json({ ok: false, code: "invalid_input" }, { status: 400 });
        try {
          const { id, total } = await storeOrder(o);
          return Response.json({ ok: true, id, total });
        } catch {
          return Response.json({ ok: false, code: "storage_error" }, { status: 500 });
        }
      },
    },
  },
});
