import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StoreShell, F } from "../components/StoreShell";

export const Route = createFileRoute("/order-confirmation")({
  head: () => ({
    meta: [{ title: "Order confirmed · ELSIAA Merch" }, { name: "robots", content: "noindex" }],
  }),
  component: ConfirmPage,
});

type Order = {
  number: string;
  name: string;
  email: string;
  ship: string;
  shipping: number;
  subtotal: number;
  total: number;
  lines: Array<{ name: string; size: string; qty: number; price: number }>;
};

function ConfirmBody() {
  const [order, setOrder] = useState<Order | null>(null);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("elsiaa-last-order");
      if (raw) setOrder(JSON.parse(raw));
    } catch {
      /* none */
    }
  }, []);

  if (!order) {
    return (
      <section className="mx-auto max-w-2xl px-6 py-10 md:py-16 text-center" style={F}>
        <h1 className="text-[24px] font-semibold text-[#111111]">No recent order found.</h1>
        <a
          href="/store"
          className="mt-6 inline-flex min-h-[50px] items-center rounded-full bg-[#111111] px-8 text-[15px] font-semibold text-white hover:opacity-85"
        >
          Back to the store →
        </a>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl px-6 py-10 md:py-16" style={F}>
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1e6b3c] text-2xl text-white">
        ✓
      </span>
      <h1 className="mt-5 text-[28px] font-semibold tracking-[-0.03em] text-[#111111]">
        Order confirmed, {order.name.split(" ")[0]}.
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-[#111111]/60">
        Order <span className="font-semibold text-[#111111]">{order.number}</span> is in. We'll
        email {order.email} shortly with tracking. Quiet things move fast.
      </p>
      <div className="mt-8 rounded-3xl border border-black/[0.08] bg-[#fafaf8] p-6">
        {order.lines.map((l, i) => (
          <div
            key={i}
            className={`flex items-baseline justify-between py-2.5 ${i > 0 ? "border-t border-black/[0.05]" : ""}`}
          >
            <span className="text-[14px] text-[#111111]">
              {l.name}{" "}
              <span className="text-[#111111]/45">
                · {l.size} × {l.qty}
              </span>
            </span>
            <span className="text-[14px] text-[#111111]/70">${l.price * l.qty}</span>
          </div>
        ))}
        <div className="mt-3 flex flex-col gap-1 border-t border-black/[0.07] pt-3 text-[13.5px]">
          <div className="flex justify-between text-[#111111]/60">
            <span>Subtotal</span>
            <span>${order.subtotal}</span>
          </div>
          <div className="flex justify-between text-[#111111]/60">
            <span>Shipping ({order.ship})</span>
            <span>{order.shipping === 0 ? "Free" : `$${order.shipping}`}</span>
          </div>
          <div className="mt-1 flex justify-between text-[16px] font-semibold text-[#111111]">
            <span>Total</span>
            <span>${order.total}</span>
          </div>
        </div>
      </div>
      <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
        <a
          href="/store"
          className="flex min-h-[50px] flex-1 items-center justify-center rounded-full bg-[#111111] text-[14.5px] font-semibold text-white hover:opacity-85"
        >
          Keep shopping →
        </a>
        <a
          href="/"
          className="flex min-h-[50px] flex-1 items-center justify-center rounded-full border border-black/[0.15] text-[14.5px] font-semibold text-[#111111] hover:border-black/40"
        >
          Back to ELSIAA
        </a>
      </div>
    </section>
  );
}

function ConfirmPage() {
  return (
    <StoreShell>
      <ConfirmBody />
    </StoreShell>
  );
}
