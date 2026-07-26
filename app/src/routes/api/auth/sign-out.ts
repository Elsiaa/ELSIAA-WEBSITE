import { createFileRoute } from "@tanstack/react-router";
import { destroyAppSession } from "../../../lib/app-session.server";

export const Route = createFileRoute("/api/auth/sign-out")({
  server: {
    handlers: {
      POST: async () => {
        await destroyAppSession().catch(() => undefined);
        return Response.json({ ok: true });
      },
    },
  },
});
