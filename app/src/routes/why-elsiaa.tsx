import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "../components/SiteNav";
import { Reveal } from "../components/Reveal";
import { absoluteUrl } from "../lib/site-url";

/*
  Why ELSIAA — the about / why-choose-us page. Built from Isya's note:
  fully insured, real tools not open-ended claims, accountable, world-class team,
  adapt-or-drown, and the mission. Light content-page style like /team & /services.
*/

export const Route = createFileRoute("/why-elsiaa")({
  head: () => ({
    meta: [
      { title: "Why ELSIAA — AI Done Better" },
      {
        name: "description",
        content:
          "Why ELSIAA: fully-insured builds, real accountable software instead of open-ended claims, a world-class team, and one mission — grow your profits, save you time and money, and dominate your industry.",
      },
      { property: "og:title", content: "Why ELSIAA" },
      { property: "og:image", content: absoluteUrl("/assets/og_cover.png") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/why-elsiaa") }],
  }),
  component: WhyElsiaa,
});

const SANS =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif";

const REASONS: Array<{ k: string; title: string; line: string }> = [
  {
    k: "01",
    title: "Fully insured",
    line: "Every build ELSIAA ships is fully insured by a real agency — Omni Agency. The risk isn't yours.",
  },
  {
    k: "02",
    title: "Accountable",
    line: "Real software and technology that pays off for you and your business — not the open-ended claims that saturate the industry.",
  },
  {
    k: "03",
    title: "A world-class team",
    line: "Operators and builders who ship hardened, tested systems — and stand behind them.",
  },
  {
    k: "04",
    title: "Adapt or drown",
    line: "We build on one understanding: the winners will be whoever uses AI most efficiently. That's the standard everything is measured against.",
  },
];

function WhyElsiaa() {
  return (
    <main className="min-h-screen bg-white text-[#111111]" style={{ fontFamily: SANS }}>
      <SiteNav />

      {/* hero */}
      <section className="mx-auto max-w-6xl px-6 pt-40 pb-8 md:pt-44">
        <Reveal>
          <p className="text-[13px] font-bold text-[#1e6b3c]">About</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-0.045em] md:text-6xl">
            Why ELSIAA?
          </h1>
          <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-[#111111]/60 md:text-[18px]">
            ELSIAA was formed to give business owners real tools that make their business more
            efficient. The industry is full of open-ended claims — we focus on leveraging AI that
            actually delivers.
          </p>
        </Reveal>
      </section>

      {/* reasons */}
      <section className="mx-auto max-w-6xl border-t border-black/[0.06] px-6 py-12 md:py-14">
        <div className="grid gap-4 sm:grid-cols-2">
          {REASONS.map((r, i) => (
            <Reveal key={r.k} delay={i * 0.05}>
              <div className="flex h-full flex-col rounded-2xl border border-black/[0.08] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#1e6b3c]/35 hover:shadow-[0_30px_70px_-45px_rgba(17,17,17,0.35)]">
                <p className="text-[13px] font-bold tracking-[0.14em] text-[#1e6b3c]">{r.k}</p>
                <h2 className="mt-3 text-xl font-semibold tracking-[-0.02em] md:text-2xl">{r.title}</h2>
                <p className="mt-2.5 text-[14.5px] leading-relaxed text-[#111111]/60">{r.line}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* mission band */}
      <section className="border-t border-black/[0.06] bg-[#0c0c0c] px-6 py-16 text-center text-[#F5F5F3] md:py-20">
        <Reveal>
          <p className="text-[13px] font-bold text-[#2e9e58]">Our mission</p>
          <p className="mx-auto mt-4 max-w-3xl text-2xl font-semibold tracking-[-0.03em] md:text-4xl">
            Grow your profits. Save you time and money. Dominate your industry.
          </p>
          <p className="mt-6 text-[14px] text-white/45">— The ELSIAA team 🦁</p>
        </Reveal>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-14 text-center">
        <Reveal>
          <a
            href="/contact"
            className="inline-flex min-h-[52px] items-center rounded-full bg-[#1e6b3c] px-9 text-[15px] font-semibold text-white transition-all hover:bg-[#111111]"
          >
            Contact →
          </a>
        </Reveal>
      </section>
    </main>
  );
}
