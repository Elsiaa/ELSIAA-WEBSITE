import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Single sign-in for portal + admin. Legacy /admin/sign-in redirects here.
 */
export const Route = createFileRoute("/admin/sign-in")({
  validateSearch: z.object({
    email: z.string().optional(),
  }),
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/portal/sign-in",
      search: {
        next: "/admin",
        ...(search.email ? { email: search.email } : {}),
      },
    });
  },
  component: () => null,
});
