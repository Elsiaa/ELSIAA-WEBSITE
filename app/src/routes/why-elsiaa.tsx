import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "../components/SiteNav";
import { Reveal } from "../components/Reveal";
import { absoluteUrl } from "../lib/site-url";

/*
  Why ELSIAA — the corporate case, stated plainly.
  Dark, precise, restrained: matches the /automate brand-lock (bg #070907,
  offices line, the Hebrew phrase) and answers the one real objection —
  "why not just use the big AI tools myself?" — without hype.
*/

export const Route = createFileRoute("/why-elsiaa")({
  head: () => ({
    meta: [
      { title: "Why ELSIAA — ELSIAA · AI Done Better" },
      {
        name: "description",
        content:
          "You know your business best — that's exactly why we partner with you. You teach us your process; we turn it into insured, production-ready systems and upgrade your business daily.",
      },
      { property: "og:title", content: "Why ELSIAA" },
      { property: "og:image", content: absoluteUrl("/assets/og_cover.png") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/why-elsiaa") }],
  }),
  component: WhyElsiaaPage,
});

const SANS =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif";
const OFFICES = "New York · Los Angeles · London · Geneva · Antwerp · Tel Aviv";
const HEBREW = "בעזרת ה׳ נעשה ונצליח";

const DIFFERENTIATORS: Array<{ num: string; title: string; body: string }> = [
  {
    num: "01",
    title: "Fully insured",
    body: "Every engagement is insured for real business use. If it runs your operation, it carries coverage — not a disclaimer.",
  },
  {
    num: "02",
    title: "We know AI's limits",
    body: "Professional judgement about what AI should and should not do in production. We deploy it where it holds, and nowhere else.",
  },
  {
    num: "03",
    title: "Security & reliability",
    body: "Hardened against bugs, viruses, and failure modes. Systems are tested, monitored, and maintained — not left running on faith.",
  },
  {
    num: "04",
    title: "Best pricing",
    body: "Production-grade systems at the strongest price for what is delivered. Fixed scope, no surprises, and you own the finished system.",
  },
];

function WhyElsiaaPage() {
  return (
    <main style={{ background: "#070907", color: "#f4f4f2", fontFamily: SANS }} className="min-h-screen">
      <SiteNav />

      {/* header meta — offices + the Hebrew line, tight under the nav */}
      <div className="border-b border-white/[0.06] pt-[68px]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-6 py-2.5">
          <span className="text-[12px] tracking-[0.01em] text-white/45">{OFFICES}</span>
          <span dir="rtl" className="text-[13px] text-white/55">{HEBREW}</span>
        </div>
      </div>

      {/* ── hero — meet the objection head-on ── */}
      <section className="relative overflow-hidden px-6 pt-20 pb-16 md:pt-28 md:pb-24">
        {/* subtle, secondary: the tools everyone already knows, faded far back */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-24 select-none text-center text-[64px] font-semibold tracking-[-0.04em] whitespace-nowrap text-white/[0.03] md:text-[120px]"
        >
          OpenAI · Claude · Gemini · Copilot
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <Reveal>
            <p className="text-[13px] font-semibold tracking-[0.02em] text-[#2e9e58]">Why ELSIAA</p>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.04] tracking-[-0.045em] md:text-6xl">
              "Why not just use Claude?
              <br />
              I know my business best."
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-[17px] leading-relaxed text-white/70 md:text-[19px]">
              Exactly. That is why we partner with you.
            </p>
            <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed text-white/55 md:text-[16px]">
              You teach us your real process. We turn it into working,
              production-ready systems — built, secured, and run to a standard
              no general-purpose tool provides on its own.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── differentiators ── */}
      <section className="border-t border-white/[0.06] px-6 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <h2 className="max-w-2xl text-2xl font-semibold tracking-[-0.03em] md:text-4xl">
              What ELSIAA adds to the tools.
            </h2>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.06] sm:grid-cols-2">
            {DIFFERENTIATORS.map((d, i) => (
              <Reveal key={d.num} delay={(i % 2) * 0.05}>
                <div className="flex h-full flex-col gap-3 bg-[#0b0e0c] p-8 md:p-10">
                  <p className="text-[13px] font-semibold tracking-[0.14em] text-[#2e9e58]">{d.num}</p>
                  <h3 className="text-[19px] font-semibold tracking-[-0.02em] text-white md:text-[21px]">
                    {d.title}
                  </h3>
                  <p className="text-[14.5px] leading-relaxed text-white/55">{d.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── the team ── */}
      <section className="border-t border-white/[0.06] px-6 py-16 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <Reveal>
            <p className="text-[13px] font-semibold tracking-[0.02em] text-[#2e9e58]">The team</p>
            <h2 className="mt-4 text-2xl font-semibold leading-[1.1] tracking-[-0.03em] md:text-4xl">
              Professionals from every industry.
              <br />
              The brightest minds in technology.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-[15px] leading-relaxed text-white/55 md:text-[16px]">
              ELSIAA is built from operators who have run businesses like yours and
              engineers who build at the frontier of AI. Partnering with ELSIAA means
              that combined expertise works on your business — your process, their
              hands, one standard.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── outcome + CTA ── */}
      <section className="border-t border-white/[0.06] px-6 pt-16 pb-24 text-center md:pt-24 md:pb-32">
        <Reveal>
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-[-0.035em] md:text-5xl">
            We upgrade your business daily.
          </h2>
          <a
            href="/quote"
            className="mt-10 inline-flex min-h-[54px] items-center rounded-full bg-[#2e9e58] px-10 text-[15px] font-semibold text-white transition-colors duration-300 hover:bg-[#1e6b3c]"
          >
            Get a quote →
          </a>
        </Reveal>
      </section>
    </main>
  );
}
