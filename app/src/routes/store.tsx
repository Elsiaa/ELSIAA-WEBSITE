import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "../components/SiteNav";
import { StoreFront } from "../components/StoreFront";

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
    links: [{ rel: "canonical", href: "https://elsiaa.higgsfield.app/store" }],
  }),
  component: StorePage,
});

function StorePage() {
  return (
    <main className="min-h-screen bg-white text-[#111111]">
      <SiteNav />
      <section className="mx-auto max-w-6xl px-6 pt-36 pb-24 md:pt-44">
        <p
          className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          The Store
        </p>
        <h1
          className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.04em] md:text-5xl"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          ELSIAA merch.
        </h1>
        <div className="mt-10">
          <StoreFront />
        </div>
      </section>
    </main>
  );
}
