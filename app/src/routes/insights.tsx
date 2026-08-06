import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SiteNav } from "../components/SiteNav";
import { Reveal } from "../components/Reveal";
import { absoluteUrl } from "../lib/site-url";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Insights — ELSIAA · AI Done Better" },
      {
        name: "description",
        content:
          "The research behind the standard. Field notes, adoption data, and honest analysis on where AI actually pays off — across healthcare, finance, marketing, retail, and operations — from the ELSIAA intelligence desk.",
      },
      { property: "og:title", content: "Insights — ELSIAA" },
      { property: "og:image", content: absoluteUrl("/assets/og_cover.png") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/insights") }],
  }),
  component: InsightsPage,
});

const mono = {
  fontFamily: "var(--font-sans)",
} as const;
const inter = {
  fontFamily: "var(--font-sans)",
} as const;

function CountUp({ target, suffix = "%" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  // render the FINAL value by default (SSR, crawlers, no-JS, reduced motion,
  // any missed trigger). Only animate up from 0 as a progressive enhancement.
  const [val, setVal] = useState(target);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setVal(target);
      return;
    }
    let raf = 0;
    let watchdog = 0;
    const run = () => {
      setVal(0);
      const t0 = performance.now();
      const dur = 1500;
      const tick = (now: number) => {
        const p = Math.min((now - t0) / dur, 1);
        setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      watchdog = window.setTimeout(() => {
        cancelAnimationFrame(raf);
        setVal(target);
      }, dur + 1500);
    };
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) {
      run();
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(watchdog);
      };
    }
    const io = new IntersectionObserver(
      (e) => {
        if (!e[0].isIntersecting) return;
        io.disconnect();
        run();
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(watchdog);
    };
  }, [target]);
  return (
    <span ref={ref} className="tabular-nums">
      {val}
      {suffix}
    </span>
  );
}

/* Adoption figures — kept consistent with the homepage and /insights history. */
const STATS = [
  { pct: 78, industry: "All industries" },
  { pct: 91, industry: "Finance" },
  { pct: 71, industry: "Marketing" },
  { pct: 66, industry: "Healthcare" },
  { pct: 63, industry: "Retail" },
  { pct: 55, industry: "Manufacturing" },
];

const FEATURED = {
  category: "Strategy",
  kicker: "Flagship report",
  title: "The 22% problem: what happens to the businesses that wait",
  dek: "Seventy-eight percent of organizations already run AI in at least one function. This report is about the other 22% — who they are, what waiting is quietly costing them, and the narrow window in which catching up is still cheap.",
  body: "Every adoption curve has a long tail, and AI's tail is now the story. When roughly four in five organizations already run AI somewhere in the business, the remaining fifth are no longer 'early' in anything — they are late, and the gap compounds monthly. The cost of waiting rarely shows up as a single line item. It shows up as slower quotes, thinner margins, staff burning hours on work a competitor automated last quarter, and customers who quietly route to the faster vendor. Our field data across healthcare, finance, and retail engagements points to the same shape: the businesses that move first don't win because their models are better — they win because they started structuring their data, their processes, and their judgment eighteen months earlier. This report maps who the 22% are, why the honest math of falling behind is steeper than it looks, and the scoped, weeks-not-quarters way back in.",
  author: "Yisrael Krug",
  role: "Principal, ELSIAA Intelligence Desk",
  read: "9 min read",
};

const ARTICLES = [
  {
    category: "Healthcare",
    title: "Why healthcare is AI's most demanding — and most rewarding — frontier",
    dek: "Two-thirds of physicians now use AI tools. The winners aren't the flashiest models — they're the best-integrated ones.",
    read: "5 min read",
  },
  {
    category: "Finance",
    title: "Finance quietly became the most AI-saturated industry on earth",
    dek: "Over nine in ten firms now deploy or assess AI. The lesson for everyone else is about data discipline.",
    read: "5 min read",
  },
  {
    category: "Design",
    title: "Generative AI ended the content bottleneck. Now taste is the moat.",
    dek: "When everyone can produce infinite adequate content, adequate content becomes worthless. Judgment is the scarce input.",
    read: "4 min read",
  },
  {
    category: "Automation",
    title: "The honest math of automation ROI",
    dek: "The most reliable returns hide in the repetitive middle — the twenty-minute task that happens ten times a day.",
    read: "6 min read",
  },
  {
    category: "Strategy",
    title: "How to choose an AI partner without getting burned",
    dek: "Three questions that expose depth, and one rule that protects you: start small, measure fast.",
    read: "5 min read",
  },
  {
    category: "Retail",
    title: "Pricing, recommendations, forecasting: where retail's 63% shows up",
    dek: "Retailers attributing revenue lift to AI rarely started with a moonshot. They started with three unglamorous loops.",
    read: "4 min read",
  },
  {
    category: "Automation",
    title: "Automating a broken process just produces mistakes faster",
    dek: "Map the process, fix the process, then automate the fixed process. Skip step two and 'AI' becomes your scapegoat.",
    read: "3 min read",
  },
  {
    category: "Design",
    title: "The interface is the product: designing AI people actually trust",
    dek: "Trust in an AI system is earned in the seams — how it shows its work, and how gracefully it hands control back.",
    read: "5 min read",
  },
  {
    category: "Finance",
    title: "Beyond fraud: the second wave of financial AI",
    dek: "Detection was the beachhead. Underwriting, regulatory reporting, and client service are where the frontier moved.",
    read: "6 min read",
  },
];

const CATEGORIES = ["All", "Automation", "Design", "Healthcare", "Finance", "Strategy", "Retail"];

function InsightsPage() {
  const [filter, setFilter] = useState("All");

  return (
    <main className="min-h-screen bg-white text-[#111111]">
      <SiteNav />

      {/* hero */}
      <section className="mx-auto max-w-6xl px-6 pt-32 pb-9 md:pt-44 md:pb-20">
        <Reveal>
          <div className="flex items-center gap-3">
            <p className="text-[13px] text-[#1e6b3c] " style={mono}>
              Insights
            </p>
            <span className="h-px w-6 bg-black/15" />
            <p className="text-[13px] text-[#111111]/45 " style={mono}>
              Research
            </p>
          </div>
          <h1
            className="mt-5 max-w-3xl text-4xl leading-[1.02] font-semibold tracking-[-0.045em] md:text-[68px]"
            style={inter}
          >
            The research behind the standard.
          </h1>
          <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-[#111111]/55" style={inter}>
            Field notes, adoption data, and honest analysis on where AI actually pays off — and
            where it quietly costs you. Written from live client engagements, not from a press
            release.
          </p>
        </Reveal>

        {/* featured lead article */}
        <Reveal delay={0.1}>
          <article className="mt-9 overflow-hidden rounded-2xl border border-black/[0.07] bg-white md:grid md:grid-cols-[1.05fr_1fr]">
            {/* type + color block instead of a photo */}
            <div className="relative flex min-h-[240px] flex-col justify-between overflow-hidden bg-[#0f1a13] p-8 md:min-h-full md:p-10">
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.35]"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 44px)",
                }}
              />
              <p className="relative text-[13px] text-[#4fb37a] " style={mono}>
                {FEATURED.kicker}
              </p>
              <div className="relative">
                <p
                  className="text-[64px] leading-none font-semibold tracking-[-0.05em] text-white/95 md:text-[92px]"
                  style={inter}
                >
                  22<span className="text-[#4fb37a]">%</span>
                </p>
                <p
                  className="mt-3 max-w-[15rem] text-[13px] leading-relaxed text-white/50"
                  style={inter}
                >
                  of organizations have not yet put AI into a single function — and the gap is
                  widening every quarter.
                </p>
              </div>
            </div>
            {/* copy */}
            <div className="p-8 md:p-11">
              <div className="flex items-center gap-3">
                <span
                  className="rounded-full bg-[#1e6b3c]/10 px-3 py-1 text-[13px] text-[#1e6b3c] "
                  style={mono}
                >
                  {FEATURED.category}
                </span>
                <span className="text-[13px] text-[#111111]/50" style={inter}>
                  {FEATURED.read}
                </span>
              </div>
              <h2
                className="mt-4 text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] md:text-[34px]"
                style={inter}
              >
                {FEATURED.title}
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-[#111111]/60" style={inter}>
                {FEATURED.dek}
              </p>
              <p
                className="mt-4 line-clamp-4 text-[14px] leading-relaxed text-[#111111]/45"
                style={inter}
              >
                {FEATURED.body}
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-black/[0.06] pt-6">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1e6b3c]/10 text-[13px] font-semibold text-[#1e6b3c]"
                    style={mono}
                  >
                    YK
                  </span>
                  <div>
                    <p className="text-[13px] font-medium text-[#111111]/80" style={inter}>
                      {FEATURED.author}
                    </p>
                    <p className="text-[13px] text-[#111111]/45" style={inter}>
                      {FEATURED.role}
                    </p>
                  </div>
                </div>
                <a
                  href="/contact"
                  className="text-[13px] text-[#1e6b3c]  transition-opacity hover:opacity-60"
                  style={mono}
                >
                  Request the report →
                </a>
              </div>
            </div>
          </article>
        </Reveal>
      </section>

      {/* stat band — stone */}
      <section className="bg-[#F5F5F3]">
        <div className="mx-auto max-w-6xl px-6 py-10 md:py-16">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[13px] text-[#1e6b3c] " style={mono}>
                  The Numbers
                </p>
                <h2
                  className="mt-3 max-w-lg text-2xl font-semibold tracking-[-0.035em] md:text-4xl"
                  style={inter}
                >
                  Adoption is no longer a question of if.
                </h2>
              </div>
              <p className="text-[13px] text-[#111111]/45" style={inter}>
                Sources below · Updated July 2026
              </p>
            </div>
          </Reveal>
          <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-3 lg:grid-cols-6">
            {STATS.map((s, i) => (
              <Reveal key={s.industry} delay={i * 0.05}>
                <div className="border-t border-black/[0.12] pt-4">
                  <p className="text-[13px] text-[#111111]/50 " style={mono}>
                    {s.industry}
                  </p>
                  <p
                    className="mt-3 text-[44px] leading-none font-semibold tracking-[-0.05em] text-[#111111] md:text-[52px]"
                    style={inter}
                  >
                    <CountUp target={s.pct} />
                  </p>
                  <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-black/10">
                    <div
                      className="h-full rounded-full bg-[#1e6b3c]"
                      style={{ width: `${s.pct}%` }}
                    />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.1}>
            <p
              className="mt-10 max-w-2xl text-[13px] leading-relaxed text-[#111111]/50"
              style={inter}
            >
              Read across: 78% of organizations already run AI in at least one business function.
              The industry lines below it aren't outliers — they're the baseline your customers now
              compare you against.
            </p>
          </Reveal>

          <div className="mt-10 border-t border-black/[0.08] pt-5" id="sources">
            <p className="text-[14px] font-medium text-[#111111]/70">Sources</p>
            <ul className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-[#111111]/55">
              <li>
                78% — McKinsey &amp; Company, <em>The State of AI</em>, global survey of
                organizations using AI in at least one business function.
              </li>
              <li>
                66% — American Medical Association, <em>Augmented Intelligence Research</em>,
                physician AI use survey.
              </li>
              <li>
                91% — NVIDIA, <em>State of AI in Financial Services</em>, firms deploying or
                assessing AI.
              </li>
              <li>
                71% — Salesforce, <em>State of Marketing</em>, teams using generative AI in their
                workflow.
              </li>
              <li>
                63% — NVIDIA, <em>State of AI in Retail &amp; CPG</em>, retailers attributing
                revenue to AI.
              </li>
              <li>
                55% — Deloitte / MAPI manufacturing AI adoption studies, AI in production
                operations.
              </li>
            </ul>
            <p className="mt-3 text-[13px] text-[#111111]/40">
              Figures are drawn from the most recent published editions of each survey; exact
              percentages vary by edition and cohort.
            </p>
          </div>
        </div>
      </section>

      {/* article grid */}
      <section className="mx-auto max-w-6xl px-6 py-10 md:py-16">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[13px] text-[#1e6b3c] " style={mono}>
                From the Desk
              </p>
              <h2
                className="mt-3 text-2xl font-semibold tracking-[-0.035em] md:text-4xl"
                style={inter}
              >
                Field notes &amp; analysis.
              </h2>
            </div>
            <p className="text-[13px] text-[#111111]/45" style={inter}>
              {ARTICLES.length} pieces · {CATEGORIES.length - 1} categories
            </p>
          </div>

          {/* category filter */}
          <div className="mt-7 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`rounded-full px-5 py-2 text-[11.5px] transition-all duration-200 ${
                  filter === c
                    ? "bg-[#111111] text-white"
                    : "border border-black/10 bg-white text-[#111111]/60 hover:border-[#111111]/40 hover:text-[#111111]"
                }`}
                style={inter}
              >
                {c}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="mt-9 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ARTICLES.map((a, i) => {
            const match = filter === "All" || a.category === filter;
            return (
              <Reveal key={a.title} delay={(i % 3) * 0.05}>
                <article
                  className="group flex h-full flex-col rounded-2xl border border-black/[0.07] bg-white p-7 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#1e6b3c]/30"
                  style={{
                    opacity: match ? 1 : 0.2,
                    transition: "opacity .35s ease, transform .3s ease, border-color .3s ease",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="rounded-full bg-[#1e6b3c]/10 px-3 py-1 text-[13px] text-[#1e6b3c] "
                      style={mono}
                    >
                      {a.category}
                    </span>
                    <span className="text-[13px] text-[#111111]/50" style={inter}>
                      {a.read}
                    </span>
                  </div>
                  <h3
                    className="mt-4 text-[18px] leading-snug font-semibold tracking-[-0.015em]"
                    style={inter}
                  >
                    {a.title}
                  </h3>
                  <p
                    className="mt-2.5 flex-1 text-[13.5px] leading-relaxed text-[#111111]/55"
                    style={inter}
                  >
                    {a.dek}
                  </p>
                  <span
                    className="mt-5 text-[13px] text-[#111111]/40  transition-colors group-hover:text-[#1e6b3c]"
                    style={mono}
                  >
                    Read →
                  </span>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* get the research CTA */}
      <section className="bg-[#F5F5F3] px-6 py-10 md:py-16 text-[#111111]">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="text-[13px] text-[#4fb37a] " style={mono}>
              Get the research
            </p>
            <h2
              className="mx-auto mt-4 max-w-xl text-3xl font-semibold tracking-[-0.035em] md:text-5xl"
              style={inter}
            >
              The next report, before it's public.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] text-[#111111]/50" style={inter}>
              We publish our field data and analysis to a short list first. No noise — a few emails
              a quarter, each one worth reading.
            </p>
            <form
              action="/contact"
              method="get"
              className="mx-auto mt-9 flex w-full max-w-md flex-col gap-3 sm:flex-row"
            >
              <input
                type="email"
                name="email"
                required
                placeholder="you@company.com"
                aria-label="Work email"
                className="w-full flex-1 rounded-full border border-black/15 bg-white/[0.05] px-6 py-4 text-[14px] text-[#111111] outline-none transition-colors placeholder:text-[#111111]/45 focus:border-[#4fb37a]"
                style={inter}
              />
              <button
                type="submit"
                className="rounded-full bg-[#1e6b3c] px-8 py-4 text-[13px] font-bold text-white  transition-all hover:bg-[#111111] hover:text-white"
                style={mono}
              >
                Subscribe →
              </button>
            </form>
            <p className="mt-4 text-[13px] text-[#111111]/45" style={inter}>
              Continues on our contact page — no spam, unsubscribe anytime.
            </p>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
