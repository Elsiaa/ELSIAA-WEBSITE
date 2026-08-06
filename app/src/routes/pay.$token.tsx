import { createFileRoute } from "@tanstack/react-router";
import { CheckoutPanel } from "../components/billing/CheckoutPanel";
import { resolveBillByToken } from "../lib/billing/checkout.functions";

export const Route = createFileRoute("/pay/$token")({
  head: () => ({
    meta: [{ title: "Pay invoice — ELSIAA" }, { name: "robots", content: "noindex" }],
  }),
  loader: async ({ params }) => {
    const bill = await resolveBillByToken({ data: { token: params.token } });
    return { bill, token: params.token };
  },
  component: PayPage,
});

function PayPage() {
  const { bill, token } = Route.useLoaderData();
  return <CheckoutPanel bill={bill} token={token} />;
}
