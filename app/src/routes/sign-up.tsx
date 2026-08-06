import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { PortalSignUpForm } from "../components/portal/PortalSignUpForm";
import { absoluteUrl } from "../lib/site-url";

const searchSchema = z.object({
  invitation: z.string().optional(),
});

export const Route = createFileRoute("/sign-up")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [{ title: "Create account — ELSIAA" }, { name: "robots", content: "noindex" }],
    links: [{ rel: "canonical", href: absoluteUrl("/sign-up") }],
  }),
  component: SignUpPage,
});

function SignUpPage() {
  return <PortalSignUpForm />;
}
