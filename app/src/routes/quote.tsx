import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "../components/SiteNav";
import { QuoteWizard } from "../components/QuoteWizard";

export const Route = createFileRoute("/quote")({
  head: () => ({
    meta: [
      { title: "Get Your Project Quoted — ELSIAA · AI Done Better" },
      {
        name: "description",
        content:
          "Tell us what you need built — design, automation, software, or consultation — and get a personal quote from ELSIAA within one business day.",
      },
      { property: "og:title", content: "Get Your Project Quoted — ELSIAA" },
      { property: "og:image", content: "https://elsiaa.higgsfield.app/assets/og_cover.png" },
    ],
    links: [
      { rel: "canonical", href: "https://elsiaa.higgsfield.app/quote" },
    ],
  }),
  component: QuotePage,
});

function QuotePage() {
  return (
    <main className="min-h-screen bg-[#FBFBFA] text-[#111111]">
      <SiteNav />
      <section className="mx-auto max-w-3xl px-6 pt-36 pb-24 md:pt-44">
        <p
          className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          Project Quote
        </p>
        <h1
          className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.04em] md:text-5xl"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Tell us what you need. We'll quote it.
        </h1>
        <p className="mt-3 text-[12px] tracking-[0.2em] text-[#1e6b3c] uppercase" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          Quote delivered within 1 business day
        </p>
        <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-[#111111]/55">
          A few focused questions — two minutes of your time. Your answers are
          distilled into a project brief for our team, and a personal quote
          comes back within one business day.
        </p>
        <div className="mt-10">
          <QuoteWizard />
        </div>
      </section>
    </main>
  );
}
