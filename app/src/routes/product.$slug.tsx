import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { StoreShell, F } from "../components/StoreShell";
import { useCart } from "../lib/cart";
import { bySlug, byCategory, CATEGORY_META, SIZES } from "../lib/merch";

export const Route = createFileRoute("/product/$slug")({
  head: ({ params }) => {
    const p = bySlug(params.slug);
    const title = p ? `${p.name} — $${p.price} · ELSIAA Merch` : "ELSIAA Merch";
    const desc = p ? `${p.description} ${p.material}` : "ELSIAA Merch — AI Done Better.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:image", content: p?.img ?? "/assets/store/merch_hero.jpg" },
      ],
      links: [{ rel: "canonical", href: `https://elsiaa.higgsfield.app/product/${params.slug}` }],
    };
  },
  component: ProductPage,
});

function ProductBody() {
  const { slug } = Route.useParams();
  const p = bySlug(slug);
  const { add } = useCart();
  const nav = useNavigate();
  const [size, setSize] = useState<string | null>(p?.oneSize ? "One Size" : null);
  const [qty, setQty] = useState(1);
  const [warn, setWarn] = useState(false);

  if (!p) {
    return (
      <section className="mx-auto max-w-6xl px-6 py-24 text-center" style={F}>
        <h1 className="text-2xl font-semibold">Not part of the catalog.</h1>
        <a href="/store" className="mt-4 inline-block text-[14px] font-medium text-[#1e6b3c] hover:underline">← Back to the store</a>
      </section>
    );
  }

  const related = byCategory(p.category).filter((x) => x.slug !== p.slug).slice(0, 3);
  const meta = CATEGORY_META[p.category];

  const requireSize = (): string | null => {
    if (!size) {
      setWarn(true);
      setTimeout(() => setWarn(false), 1600);
      return null;
    }
    return size;
  };

  return (
    <>
      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 pt-8 pb-16 md:grid-cols-2 md:gap-14 md:pt-14" style={F}>
        {/* gallery */}
        <div className="flex flex-col gap-3">
          <div className="overflow-hidden rounded-3xl bg-[#f6f6f4]">
            <img src={p.img} alt={p.name} className="aspect-[3/4] w-full object-cover" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="overflow-hidden rounded-2xl bg-[#f6f6f4]">
                <img
                  src={p.img}
                  alt=""
                  aria-hidden="true"
                  className="aspect-square w-full object-cover"
                  style={{ objectPosition: `${30 + i * 25}% ${25 + i * 25}%`, transform: `scale(${1.6 + i * 0.3})` }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* details */}
        <div className="md:pt-4">
          <p className="text-[13px] text-[#111111]/45">{meta.title} · {meta.sub}</p>
          <h1 className="mt-1.5 text-[26px] font-semibold tracking-[-0.02em] text-[#111111] md:text-[32px]">{p.name}</h1>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-[20px] font-semibold text-[#111111]">${p.price}</span>
            {p.limited && <span className="rounded-full bg-[#1e6b3c]/[0.08] px-3 py-1 text-[12px] font-semibold text-[#1e6b3c]">Limited</span>}
          </div>
          {p.limited && (
            <p className="mt-2 text-[13px] text-[#111111]/45">One run. When this drop sells through, it's never reprinted.</p>
          )}
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[#111111]/70">{p.description}</p>
          <p className="mt-3 text-[13px] text-[#111111]/45">{p.material}</p>

          {/* size */}
          <p className={`mt-7 text-[13.5px] font-medium transition-colors ${warn ? "text-red-600" : "text-[#111111]/70"}`}>
            {p.oneSize ? "Size" : warn ? "Pick a size first" : "Size"}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {(p.oneSize ? ["One Size"] : [...SIZES]).map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                aria-pressed={size === s}
                className={`min-h-[44px] rounded-xl border px-5 text-[14px] font-medium transition-all ${
                  size === s ? "border-[#111111] bg-[#111111] text-white" : `${warn ? "border-red-300" : "border-black/[0.14]"} text-[#111111]/70 hover:border-black/40`
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* qty */}
          <p className="mt-6 text-[13.5px] font-medium text-[#111111]/70">Quantity</p>
          <div className="mt-2.5 flex w-fit items-center rounded-xl border border-black/[0.14]">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="h-11 w-11 text-[17px]" aria-label="Decrease quantity">−</button>
            <span className="w-8 text-center text-[15px]">{qty}</span>
            <button onClick={() => setQty(qty + 1)} className="h-11 w-11 text-[17px]" aria-label="Increase quantity">+</button>
          </div>

          {/* actions */}
          <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
            <button
              onClick={() => { const s = requireSize(); if (s) add(p.slug, s, qty); }}
              className="flex min-h-[52px] flex-1 items-center justify-center rounded-full bg-[#111111] px-8 text-[15px] font-semibold text-white transition-opacity hover:opacity-85"
            >
              Add to Cart
            </button>
            <button
              onClick={() => { const s = requireSize(); if (s) { add(p.slug, s, qty); nav({ to: "/checkout" }); } }}
              className="flex min-h-[52px] flex-1 items-center justify-center rounded-full border border-[#111111] px-8 text-[15px] font-semibold text-[#111111] transition-all hover:bg-[#111111] hover:text-white"
            >
              Buy Now
            </button>
          </div>
          <p className="mt-4 text-[13px] text-[#111111]/40">Free standard shipping · Express available at checkout</p>
        </div>
      </section>

      {/* mobile sticky add bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/[0.06] bg-white/95 px-4 pt-3 backdrop-blur-md md:hidden" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))", ...F }}>
        <button
          onClick={() => { const s = requireSize(); if (s) add(p.slug, s, qty); }}
          className="flex min-h-[50px] w-full items-center justify-center rounded-full bg-[#111111] text-[15px] font-semibold text-white active:opacity-80"
        >
          Add to Cart — ${p.price * qty}
        </button>
      </div>

      {/* related */}
      {related.length > 0 && (
        <section className="mx-auto max-w-6xl border-t border-black/[0.06] px-6 py-14 pb-28 md:pb-14" style={F}>
          <h2 className="text-[18px] font-semibold text-[#111111]">More from {meta.title}</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
            {related.map((r) => (
              <a key={r.slug} href={`/product/${r.slug}`} className="group">
                <div className="overflow-hidden rounded-2xl bg-[#f6f6f4]">
                  <img src={r.img} alt={r.name} loading="lazy" className="aspect-[3/4] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-[13.5px] font-medium text-[#111111]">{r.name}</span>
                  <span className="text-[13.5px] text-[#111111]/60">${r.price}</span>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function ProductPage() {
  return (
    <StoreShell>
      <ProductBody />
    </StoreShell>
  );
}
