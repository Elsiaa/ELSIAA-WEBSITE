import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SiteNav } from "../components/SiteNav";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "AI Insights — ELSIAA · AI Done Better" },
      {
        name: "description",
        content:
          "Live statistics and research on AI adoption across healthcare, finance, retail, manufacturing, and marketing — from the ELSIAA intelligence desk.",
      },
      { property: "og:title", content: "AI Insights — ELSIAA" },
      { property: "og:image", content: "/assets/og_cover.png" },
    ],
  }),
  component: InsightsPage,
});

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (e) => {
        if (e[0].isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: on ? 1 : 0,
        transform: on ? "none" : "translateY(20px)",
        transition: `opacity .7s ease ${delay}s, transform .7s cubic-bezier(.2,.8,.2,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

function CountUp({ target, suffix = "%" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const io = new IntersectionObserver(
      (e) => {
        if (!e[0].isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const dur = 1500;
        const tick = (now: number) => {
          const p = Math.min((now - t0) / dur, 1);
          setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [target]);
  return (
    <span ref={ref} className="tabular-nums">
      {val}
      {suffix}
    </span>
  );
}

const STATS = [
  { pct: 78, industry: "All industries", line: "of organizations use AI in at least one business function — up from roughly half just three years ago." },
  { pct: 66, industry: "Healthcare", line: "of physicians report using health AI tools in practice — nearly double the share from two years prior." },
  { pct: 91, industry: "Finance", line: "of financial services firms are deploying AI or assessing it for core workflows." },
  { pct: 71, industry: "Marketing", line: "of marketing teams use generative AI at least weekly for content, campaigns, or analysis." },
  { pct: 63, industry: "Retail", line: "of retailers attribute measurable revenue lift to AI in pricing, recommendations, or forecasting." },
  { pct: 55, industry: "Manufacturing", line: "of manufacturers apply AI across production, quality control, or supply-chain operations." },
];

const ARTICLES = [
  {
    tag: "Healthcare",
    title: "Why healthcare is AI's most demanding — and most rewarding — frontier",
    body: "Healthcare adoption of AI has moved faster than almost anyone predicted: two-thirds of physicians now report using AI tools in their practice, from ambient scribes that draft clinical notes to imaging models that flag anomalies before a radiologist opens the study. What makes healthcare different is the cost of being wrong. A misfired marketing email is an annoyance; a misread scan is a life. That's why the winners in healthcare AI aren't the flashiest models but the best-integrated ones — systems that sit inside existing clinical workflows, keep the physician in command, and document every decision. For clinics, staffing agencies, and telehealth operators, the practical opportunity is less exotic than the headlines suggest: intake automation, scheduling, documentation, billing, and follow-up. These are the hours that burn out clinical teams, and they are exactly where AI is already reliable. The organizations winning right now are the ones that automated the boring parts first.",
  },
  {
    tag: "Finance",
    title: "Finance quietly became the most AI-saturated industry on earth",
    body: "While consumer attention fixates on chatbots, financial services crossed a threshold with little fanfare: over nine in ten firms are now deploying or actively assessing AI. Fraud detection was the beachhead — models that watch millions of transactions and flag the handful that don't belong — but the frontier has moved into underwriting, portfolio research, regulatory reporting, and client service. The lesson for every other industry is about data discipline. Finance adopted AI fastest because it had already spent decades structuring its data and defining its risk controls. Firms that know exactly what they know can hand that knowledge to a machine; firms with tribal knowledge scattered across inboxes cannot. Before buying any AI system, the highest-return investment is usually the unglamorous one: clean, centralized, well-governed data. The AI is only ever as good as what it's allowed to read.",
  },
  {
    tag: "Marketing",
    title: "Generative AI ended the content bottleneck. Now taste is the moat.",
    body: "Seventy-one percent of marketing teams now use generative AI weekly. The immediate effect was obvious — content velocity exploded. The second-order effect is the interesting one: when everyone can produce infinite adequate content, adequate content becomes worthless. Feeds are flooded with competent, forgettable output that audiences scroll past without registering. The scarce resources now are taste, brand distinctiveness, and judgment — knowing what not to publish. The teams winning in this environment use AI as a drafting engine inside a strong editorial system: human-defined voice, human-approved concepts, machine-accelerated production, human final cut. That workflow can triple output while sharpening quality. AI without an editorial spine just triples the noise. The brands that will own the next five years treat AI as a force multiplier for a point of view — not a replacement for having one.",
  },
  {
    tag: "Operations",
    title: "The honest math of automation ROI",
    body: "The most reliable AI returns aren't in moonshots — they're in the repetitive middle of every business: data entry, document processing, follow-up emails, invoice handling, report generation. The math is simple and brutal. Take a task that takes twenty minutes, happens ten times a day, and touches three employees: that's roughly 2,500 hours a year. Automate eighty percent of it and you've recovered a full-time employee's worth of hours — without hiring, training, or turnover. Multiply across five or six such workflows and mid-sized companies routinely find six figures of annual capacity hiding in plain sight. The failure mode is equally predictable: automating a broken process just produces mistakes faster. The sequence that works is map the process, fix the process, then automate the fixed process. Companies that respect that order see payback in months. Companies that skip step two write off 'AI' as hype and never learn why.",
  },
  {
    tag: "Strategy",
    title: "How to choose an AI partner without getting burned",
    body: "The AI services market is crowded with vendors selling the same three demos. Cutting through it requires asking questions that expose depth. First: ask to see something they shipped that's still running a year later — maintenance is where AI projects die, and anyone can make an impressive prototype. Second: ask how they handle your data — where it lives, who can see it, what happens when you leave. Vague answers here are disqualifying. Third: ask what they'd refuse to build. A partner with no opinion about where AI shouldn't be used hasn't been doing this long enough to have scars. Finally, insist on starting small: a scoped engagement with a measurable outcome in weeks, not a transformation roadmap measured in quarters. The right partner will welcome that structure, because they know the fastest way to earn a large engagement is to win a small one first.",
  },
];

function InsightsPage() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <main className="min-h-screen bg-white text-[#111111]">
      <SiteNav />
      {/* hero */}
      <section className="mx-auto max-w-6xl px-6 pt-40 pb-6 md:pt-44">
        <Reveal>
          <p
            className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Intelligence
          </p>
          <h1
            className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-0.04em] md:text-6xl"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            AI, measured.
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[#111111]/55">
            What adoption actually looks like across the industries we serve —
            the numbers, and what they mean for your business.
          </p>
        </Reveal>
      </section>

      {/* stats grid */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {STATS.map((s, i) => (
            <Reveal key={s.industry} delay={i * 0.05}>
              <div className="flex h-full flex-col rounded-xl border border-black/[0.07] bg-white p-5">
                <span
                  className="text-[10px] tracking-[0.24em] text-[#1e6b3c] uppercase"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {s.industry}
                </span>
                <span
                  className="mt-2 text-5xl font-semibold tracking-[-0.04em] md:text-6xl"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  <CountUp target={s.pct} />
                </span>
                <p className="mt-2.5 text-[12.5px] leading-relaxed text-[#111111]/55">
                  {s.line}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-[#111111]/35">
          Figures reflect published industry surveys, 2024–2025. Rounded.
        </p>
      </section>

      {/* articles */}
      <section className="mx-auto max-w-4xl px-6 py-14 md:py-16">
        <Reveal>
          <h2
            className="text-[11px] tracking-[0.28em] text-[#111111]/40 uppercase"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            From the desk
          </h2>
        </Reveal>
        <div className="mt-6 space-y-3">
          {ARTICLES.map((a, i) => (
            <Reveal key={a.title} delay={i * 0.04}>
              <article className="overflow-hidden rounded-xl border border-black/[0.07] bg-white">
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-black/[0.015]"
                >
                  <div>
                    <span
                      className="text-[10px] tracking-[0.24em] text-[#1e6b3c] uppercase"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      {a.tag}
                    </span>
                    <h3
                      className="mt-1.5 text-[16px] font-semibold tracking-[-0.01em] md:text-lg"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      {a.title}
                    </h3>
                  </div>
                  <span
                    className={`flex h-8 w-8 flex-none items-center justify-center rounded-full border border-black/10 text-[13px] transition-all duration-300 ${
                      open === i ? "rotate-45 border-[#1e6b3c] bg-[#1e6b3c] text-white" : "text-[#111111]/50"
                    }`}
                  >
                    +
                  </span>
                </button>
                {open === i && (
                  <div className="border-t border-black/[0.05] px-5 pt-4 pb-6">
                    <p className="text-[14.5px] leading-[1.8] text-[#111111]/70" style={{ fontFamily: "'Inter', sans-serif" }}>
                      {a.body}
                    </p>
                  </div>
                )}
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl border-t border-black/[0.06] px-6 py-16 text-center">
        <Reveal>
          <p className="text-lg font-semibold tracking-[-0.02em] md:text-2xl" style={{ fontFamily: "'Inter', sans-serif" }}>
            Your industry is on this page. Your competitors are already moving.
          </p>
          <a
            href="/#book"
            className="mt-5 inline-flex items-center gap-3 rounded-full bg-[#111111] px-8 py-4 text-[11px] font-bold tracking-[0.22em] text-white uppercase transition-all duration-300 hover:bg-[#1e6b3c]"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Book a free 20-minute call →
          </a>
          <p
            className="mt-12 text-[11px] tracking-[0.2em] text-[#111111]/35 uppercase"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            בעזרת ה׳ נעשה ונצליח
          </p>
        </Reveal>
      </section>
    </main>
  );
}
