import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { PortalSignInForm } from "../../components/portal/PortalSignInForm";
import { getPortalAuthState } from "../../lib/portal/auth.functions";
import { absoluteUrl } from "../../lib/site-url";

const searchSchema = z.object({
  email: z.string().optional(),
  /** After sign-in: `/portal` (default) or `/admin`. */
  next: z.enum(["/portal", "/admin"]).optional(),
});

export const Route = createFileRoute("/portal/sign-in")({
  validateSearch: searchSchema,
  beforeLoad: async ({ search }) => {
    const auth = await getPortalAuthState();
    if (auth.authenticated) {
      throw redirect({ to: search.next === "/admin" ? "/admin" : "/portal" });
    }
    return { auth };
  },
  head: () => ({
    meta: [
      { title: "Sign in — ELSIAA" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/portal/sign-in") }],
  }),
  component: PortalSignInPage,
});

function PortalSignInPage() {
  const { auth } = Route.useRouteContext();
  const { email, next } = Route.useSearch();
  return (
    <PortalSignInForm initial={auth} initialEmail={email} next={next} />
  );
}
