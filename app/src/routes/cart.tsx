import { createFileRoute } from "@tanstack/react-router";
import { StoreShell, F } from "../components/StoreShell";
import { useCart } from "../lib/cart";
import { bySlug } from "../lib/merch";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Cart · ELSIAA Merch" },
      { name: "description", content: "Your ELSIAA Merch cart." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

function CartBody() {
  const { lines, subtotal, setQty, remove, clear } = useCart();

  if (lines.length === 0) {
    return (
      <section
        className="mx-auto flex max-w-2xl flex-col items-center px-6 py-10 md:py-16 text-center"
        style={F}
      >
        <img src="/assets/elsiaa-lion-192.png" alt="" className="h-14 w-14 opacity-25" />
        <h1 className="mt-5 text-[24px] font-semibold tracking-[-0.02em] text-[#111111]">
          Your cart is empty.
        </h1>
        <p className="mt-2 max-w-sm text-[14.5px] leading-relaxed text-[#111111]/55">
          Quiet, heavy, never reprinted — the good ones don't wait long.
        </p>
        <a
          href="/store"
          className="mt-7 inline-flex min-h-[50px] items-center rounded-full bg-[#111111] px-8 text-[15px] font-semibold text-white transition-opacity hover:opacity-85"
        >
          Browse the store →
        </a>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-8 md:py-16" style={F}>
      <div className="flex items-baseline justify-between">
        <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-[#111111]">Cart</h1>
        <button onClick={clear} className="text-[13px] text-[#111111]/45 hover:text-[#111111]">
          Clear cart
        </button>
      </div>
      <div className="mt-6 divide-y divide-black/[0.06] border-y border-black/[0.06]">
        {lines.map((l) => {
          const p = bySlug(l.slug);
          if (!p) return null;
          return (
            <div key={`${l.slug}-${l.size}`} className="flex gap-5 py-5">
              <a href={`/product/${p.slug}`} className="flex-none">
                <img
                  src={p.img}
                  alt={p.name}
                  className="h-28 w-22 rounded-xl object-cover"
                  style={{ width: "88px" }}
                />
              </a>
              <div className="flex flex-1 flex-col">
                <div className="flex items-baseline justify-between gap-4">
                  <a
                    href={`/product/${p.slug}`}
                    className="text-[15px] font-medium text-[#111111] hover:underline"
                  >
                    {p.name}
                  </a>
                  <span className="text-[15px] font-semibold text-[#111111]">
                    ${p.price * l.qty}
                  </span>
                </div>
                <p className="mt-0.5 text-[13px] text-[#111111]/45">
                  {l.size}
                  {p.limited ? " · Limited" : ""} · ${p.price} each
                </p>
                <div className="mt-auto flex items-center gap-4 pt-3">
                  <div className="flex items-center rounded-full border border-black/[0.12]">
                    <button
                      onClick={() => setQty(l.slug, l.size, l.qty - 1)}
                      className="h-9 w-9 text-[16px]"
                      aria-label={`Decrease ${p.name}`}
                    >
                      −
                    </button>
                    <span className="w-7 text-center text-[14px]">{l.qty}</span>
                    <button
                      onClick={() => setQty(l.slug, l.size, l.qty + 1)}
                      className="h-9 w-9 text-[16px]"
                      aria-label={`Increase ${p.name}`}
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => remove(l.slug, l.size)}
                    className="text-[13px] text-[#111111]/45 hover:text-[#111111]"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 flex flex-col items-end gap-1.5">
        <div className="flex w-full max-w-xs items-baseline justify-between">
          <span className="text-[14px] text-[#111111]/60">Subtotal</span>
          <span className="text-[16px] font-semibold text-[#111111]">${subtotal}</span>
        </div>
        <p className="text-[12.5px] text-[#111111]/40">
          Standard shipping free · Express $25 at checkout
        </p>
      </div>
      <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:justify-end">
        <a
          href="/store"
          className="flex min-h-[50px] items-center justify-center rounded-full border border-black/[0.15] px-8 text-[14.5px] font-semibold text-[#111111] transition-colors hover:border-black/40"
        >
          Continue Shopping
        </a>
        <a
          href="/checkout"
          className="flex min-h-[50px] items-center justify-center rounded-full bg-[#111111] px-10 text-[14.5px] font-semibold text-white transition-opacity hover:opacity-85"
        >
          Proceed to Checkout →
        </a>
      </div>
    </section>
  );
}

function CartPage() {
  return (
    <StoreShell>
      <CartBody />
    </StoreShell>
  );
}
