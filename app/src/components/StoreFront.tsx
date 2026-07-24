import { useState } from "react";
import { useCart } from "../lib/cart";
import { byCategory, CATEGORY_META, CATEGORY_ORDER, SIZES, type MerchProduct } from "../lib/merch";
import { F } from "./StoreShell";

/* StoreFront — the listing. Category chapters with the exact catalog copy,
   premium cards, quick-add (default M / One Size), links into product pages. */

function Card({ p }: { p: MerchProduct }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  return (
    <div className="group" style={F}>
      <a href={`/product/${p.slug}`} className="block overflow-hidden rounded-2xl bg-[#f6f6f4]">
        <img
          src={p.img}
          alt={p.name}
          loading="lazy"
          className="aspect-[3/4] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
      </a>
      <div className="mt-3.5 flex items-baseline justify-between gap-2">
        <a href={`/product/${p.slug}`} className="text-[14px] font-medium text-[#111111] hover:underline">{p.name}</a>
        <span className="text-[14px] text-[#111111]/60">${p.price}</span>
      </div>
      <div className="mt-1 flex items-center justify-between">
        {p.limited ? <span className="text-[12px] font-semibold text-[#1e6b3c]">Limited</span> : <span className="text-[12px] text-[#111111]/40">{p.blurb}</span>}
        <button
          onClick={() => {
            add(p.slug, p.oneSize ? "One Size" : "M");
            setAdded(true);
            setTimeout(() => setAdded(false), 1100);
          }}
          className="rounded-full border border-black/[0.15] px-4 py-1.5 text-[12.5px] font-semibold text-[#111111] transition-all hover:border-[#111111] hover:bg-[#111111] hover:text-white"
        >
          {added ? "Added ✓" : "Add to Cart"}
        </button>
      </div>
      {!p.oneSize && (
        <p className="mt-1.5 text-[11.5px] text-[#111111]/35">{SIZES.join(" · ")}</p>
      )}
    </div>
  );
}

export function StoreFront() {
  return (
    <div className="flex flex-col gap-16 md:gap-20" style={F}>
      {CATEGORY_ORDER.map((c) => {
        const meta = CATEGORY_META[c];
        const items = byCategory(c);
        return (
          <section key={c} id={c}>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-[#111111] md:text-[26px]">{meta.title}</h2>
              <span className="text-[14px] text-[#1e6b3c]">{meta.sub}</span>
            </div>
            <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[#111111]/55">{meta.note}</p>
            <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
              {items.map((p) => <Card key={p.slug} p={p} />)}
            </div>
          </section>
        );
      })}
    </div>
  );
}
