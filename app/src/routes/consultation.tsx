import { createFileRoute, redirect } from "@tanstack/react-router";

// Consultation lives on the Contact Us page now — permanent redirect.
export const Route = createFileRoute("/consultation")({
  beforeLoad: () => {
    throw redirect({ to: "/contact" });
  },
});
