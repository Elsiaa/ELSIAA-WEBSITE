import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { PortalSignInForm } from "../../components/portal/PortalSignInForm";
import { getPortalAuthState } from "../../lib/portal/auth.functions";
import { absoluteUrl } from "../../lib/site-url";

const searchSchema = z.object({
  email: z.string().optional(),
});

export const Route = createFileRoute("/portal/sign-in")({
  validateSearch: searchSchema,
  beforeLoad: async () => {
    const auth = await getPortalAuthState();
    if (auth.authenticated) {
      throw redirect({ to: "/portal" });
    }
    return { auth };
  },
  head: () => ({
    meta: [
      { title: "Sign in — ELSIAA Portal" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/portal/sign-in") }],
  }),
  component: PortalSignInPage,
});

function PortalSignInPage() {
  const { auth } = Route.useRouteContext();
  const { email } = Route.useSearch();
  return <PortalSignInForm initial={auth} initialEmail={email} />;
}
