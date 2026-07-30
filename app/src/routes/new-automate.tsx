import { createFileRoute, redirect } from "@tanstack/react-router";

/* Automate and the Secretary are one page now. Keep the old /new-automate URL
   working by redirecting it to the unified /automate page. */
export const Route = createFileRoute("/new-automate")({
  beforeLoad: () => {
    throw redirect({ to: "/automate" });
  },
});
