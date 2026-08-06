import { createFileRoute } from "@tanstack/react-router";
import PaymentPage from "../../components/payments/payment-page";
import { absoluteUrl } from "../../lib/site-url";

export const Route = createFileRoute("/payments/")({
  head: () => ({
    meta: [{ title: "Payments — ELSIAA" }, { name: "robots", content: "noindex" }],
    links: [{ rel: "canonical", href: absoluteUrl("/payments") }],
  }),
  component: () => (
    <main className="min-h-screen bg-[#F5F5F3]">
      <PaymentPage />
    </main>
  ),
});
