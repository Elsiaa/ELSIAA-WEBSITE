import { createFileRoute } from "@tanstack/react-router";
import SignPageClient from "../../components/signatures/public-sign";
import { absoluteUrl } from "../../lib/site-url";

export const Route = createFileRoute("/sign/$token")({
  head: () => ({
    meta: [{ title: "Sign document — ELSIAA" }, { name: "robots", content: "noindex" }],
    links: [{ rel: "canonical", href: absoluteUrl("/sign") }],
  }),
  component: PublicSignPage,
});

function PublicSignPage() {
  const { token } = Route.useParams();
  return (
    <main className="min-h-screen bg-[#F5F5F3]">
      <SignPageClient token={token} />
    </main>
  );
}
