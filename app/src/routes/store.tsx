import { createFileRoute } from "@tanstack/react-router";
import { StoreFront } from "../components/StoreFront";
import { StoreShell } from "../components/StoreShell";
import { absoluteUrl } from "../lib/site-url";

export const Route = createFileRoute("/store")({
  head: () => ({
    meta: [
      { title: "ELSIAA Merch — The Store · AI Done Better" },
      {
        name: "description",
        content:
          "Discover ELSIAA merch — the Day-to-Day line in black, white, and grey; the limited City Line in pop colors for Europe, New York, and LA; and the restrained Old Money oversized tees.",
      },
      { property: "og:title", content: "ELSIAA Merch — The Store" },
      { property: "og:image", content: "/assets/store/merch_hero.jpg" },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/store") }],
  }),
  component: StorePage,
});

function StorePage() {
  const F = { fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" };
  return (
    <StoreShell>
      <section className="mx-auto max-w-6xl px-6 pt-12 pb-20 md:pt-16 md:pb-24">
        <p className="text-[13px] font-bold text-[#1e6b3c]" style={F}>The Store</p>
        <h1 className="mt-2 max-w-2xl text-3xl font-semibold tracking-[-0.04em] md:text-5xl" style={F}>
          ELSIAA Merch — AI Done Better.
        </h1>
        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-[#111111]/55" style={F}>
          Quiet, heavy, never reprinted. Four chapters — pick yours.
        </p>
        <div className="mt-10 md:mt-14">
          <StoreFront />
        </div>
      </section>
    </StoreShell>
  );
}
