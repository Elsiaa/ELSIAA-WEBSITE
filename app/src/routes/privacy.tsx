import { createFileRoute, redirect } from "@tanstack/react-router";

// Permanent alias — the canonical page lives at /legal/privacy.
export const Route = createFileRoute("/privacy")({
  beforeLoad: () => {
    throw redirect({ to: "/legal/privacy", statusCode: 301 });
  },
});
