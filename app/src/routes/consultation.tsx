import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "../components/SiteNav";
import { Reveal } from "../components/Reveal";
import { ConsultOptions } from "../components/ConsultOptions";
import { absoluteUrl } from "../lib/site-url";

export const Route = createFileRoute("/consultation")({
  head: () => ({
    meta: [
      { title: "Consultation — ELSIAA · AI Done Better" },
      {
        name: "description",
        content:
          "Strategy, technology, growth. A strategy session, a two-week build, or a monthly advisor — book in a click.",
      },
      { property: "og:title", content: "Consultation — ELSIAA" },
      { property: "og:image", content: absoluteUrl("/assets/og_cover.png") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/consultation") }],
  }),
  component: ConsultationPage,
});

const SANS = "var(--font-sans)";

function ConsultationPage() {
  return (
    <main className="min-h-screen bg-white text-[#111111]" style={{ fontFamily: SANS }}>
      <SiteNav />

      {/* hero */}
      <section className="mx-auto max-w-6xl px-6 pt-36 pb-8 text-center md:pt-44 md:pb-16">
        <Reveal>
          <h1 className="text-5xl font-semibold tracking-[-0.045em] md:text-7xl">Consultation</h1>
          <p className="mt-5 text-[15px] font-medium tracking-[0.06em] text-[#111111]/45 md:text-[16px]">
            Strategy · Technology · Growth
          </p>
        </Reveal>
      </section>

      {/* the three options */}
      <section className="mx-auto max-w-6xl px-6 pb-12 md:pb-32">
        <Reveal delay={0.08}>
          <ConsultOptions headingLevel={2} />
        </Reveal>
      </section>
    </main>
  );
}
