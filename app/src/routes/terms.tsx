import { createFileRoute, redirect } from "@tanstack/react-router";

// Permanent alias — the canonical page lives at /legal/terms.
export const Route = createFileRoute("/terms")({
  beforeLoad: () => {
    throw redirect({ to: "/legal/terms", statusCode: 301 });
  },
});
