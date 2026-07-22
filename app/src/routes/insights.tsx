import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SiteNav } from "../components/SiteNav";
import { Reveal } from "../components/Reveal";

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
      { property: "og:image", content: "https://elsiaa.higgsfield.app/assets/og_cover.png" },
    ],
    links: [{ rel: "canonical", href: "https://elsiaa.higgsfield.app/insights" }],
  }),
  component: InsightsPage,
});


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
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          setVal(target);
          return;
        }
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

const AUTHORS: Record<string, { name: string; photo: string }> = {
  Healthcare: { name: "Dr. Esther Krug, MD", photo: "/assets/team/ek.jpg" },
  Finance: { name: "Mendel Parnas", photo: "/assets/team/mp.jpg" },
  Marketing: { name: "Izzy Eisenberg", photo: "/assets/team/ie.jpg" },
  Operations: { name: "David Heimowitz", photo: "/assets/team/dh.jpg" },
  Strategy: { name: "Yisrael Krug", photo: "/assets/team/yk.jpg" },
};

const CASES = [
  {
    tag: "Design · Web",
    client: "Mr. Bins — waste management",
    before: "Dated site, no mobile path, quotes by phone tag.",
    after: "Full brand + conversion site rebuilt; quote flow reduced to two steps.",
    metric: "2× faster quote flow",
  },
  {
    tag: "Automation · Healthcare",
    client: "Multi-clinic group (anonymized)",
    before: "Front desk buried in intake forms, scheduling, and documentation.",
    after: "Intake, scheduling, and note drafting automated around the existing EHR.",
    metric: "60% less admin time",
  },
  {
    tag: "Automation · Retail",
    client: "E-commerce brand (anonymized)",
    before: "Manual product imagery and static pricing across 4,000 SKUs.",
    after: "Staged product renders + automated pricing and forecasting loops.",
    metric: "31% conversion lift",
  },
];

function readTime(body: string) {
  return `${Math.max(2, Math.round(body.split(/\s+/).length / 200))} min read`;
}

function RoiCalculator() {
  const [team, setTeam] = useState(5);
  const [rate, setRate] = useState(45);
  const [hours, setHours] = useState(8);
  const [pct, setPct] = useState(70);
  const yearlyHours = Math.round(team * hours * 52 * (pct / 100));
  const yearlySavings = Math.round(yearlyHours * rate);
  const mono = { fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" } as const;
  const inter = { fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" } as const;
  const Row = ({ label, value, suffix, min, max, step, onChange }: { label: string; value: number; suffix: string; min: number; max: number; step: number; onChange: (n: number) => void }) => (
    <div className="py-3">
      <div className="flex items-baseline justify-between">
        <p className="text-[13px] text-[#111111]/60" style={inter}>{label}</p>
        <p className="text-[14px] font-semibold tabular-nums" style={mono}>{value}{suffix}</p>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-[#1e6b3c]"
        aria-label={label}
      />
    </div>
  );
  return (
    <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-black/[0.07] bg-white md:grid-cols-2">
      <div className="border-b border-black/[0.06] p-7 md:border-r md:border-b-0">
        <Row label="People touching repetitive work" value={team} suffix="" min={1} max={50} step={1} onChange={setTeam} />
        <Row label="Average fully-loaded hourly cost" value={rate} suffix=" $/h" min={20} max={150} step={5} onChange={setRate} />
        <Row label="Repetitive hours per person, weekly" value={hours} suffix=" h" min={1} max={30} step={1} onChange={setHours} />
        <Row label="Share we can automate" value={pct} suffix="%" min={30} max={90} step={5} onChange={setPct} />
      </div>
      <div className="flex flex-col justify-center p-7 text-center">
        <p className="text-[10px] tracking-[0.28em] text-[#111111]/55 uppercase" style={mono}>Recovered annually</p>
        <p className="mt-3 text-5xl font-semibold tracking-[-0.04em] text-[#1e6b3c]" style={inter}>
          ${yearlySavings.toLocaleString()}
        </p>
        <p className="mt-2 text-[14px] text-[#111111]/55" style={inter}>
          ≈ {yearlyHours.toLocaleString()} hours of capacity, every year
        </p>
        <a
          href="/contact"
          className="mx-auto mt-6 rounded-full bg-[#1e6b3c] px-7 py-3.5 text-[11px] font-bold tracking-[0.2em] text-white uppercase transition-all hover:bg-[#111111]"
          style={mono}
        >
          Reclaim these hours →
        </a>
        <p className="mt-3 text-[11px] text-[#111111]/50" style={inter}>
          Directional estimate — the free call makes it precise.
        </p>
      </div>
    </div>
  );
}

function InsightsPage() {
  const [filter, setFilter] = useState("All industries");
  const mono = { fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" } as const;
  const inter = { fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" } as const;
  const industries = STATS.map((s) => s.industry);
  const shown = filter === "All industries" ? STATS : STATS.filter((s) => s.industry === filter || s.industry === "All industries");
  const featured = ARTICLES[0];
  const rest = ARTICLES.slice(1);
  return (
    <main className="min-h-screen bg-white text-[#111111]">
      <SiteNav />

      {/* hero */}
      <section className="mx-auto max-w-6xl px-6 pt-40 pb-10 md:pt-44">
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-[minmax(0,1fr)_420px]">
          <Reveal>
            <p className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase" style={mono}>
              ELSIAA Insights
            </p>
            <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-[-0.04em] md:text-6xl" style={inter}>
              The state of AI, without the hype.
            </h1>
            <p className="mt-4 max-w-lg text-[15.5px] leading-relaxed text-[#111111]/55" style={inter}>
              What adoption actually looks like across industries, what the
              returns honestly are, and how to move before your competitors do.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-8">
              <a
                href="/contact"
                className="rounded-full bg-[#1e6b3c] px-7 py-3.5 text-[11px] font-bold tracking-[0.2em] text-white uppercase transition-all hover:bg-[#111111]"
                style={mono}
              >
                Book Free Strategy Call →
              </a>
              <div className="flex gap-8">
                {[
                  { n: 78, l: "Adoption" },
                  { n: 91, l: "Finance" },
                  { n: 66, l: "Healthcare" },
                ].map((st) => (
                  <div key={st.l}>
                    <p className="text-xl font-semibold tracking-[-0.02em]" style={inter}>
                      <CountUp target={st.n} />
                    </p>
                    <p className="mt-0.5 text-[10px] tracking-[0.2em] text-[#111111]/55 uppercase" style={mono}>
                      {st.l}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <img
              src="/assets/insights_hero_line.jpg"
              alt="Chaos resolving into a single clear line"
              className="hidden w-full md:block"
              loading="eager"
            />
          </Reveal>
        </div>
      </section>

      {/* stats — filterable */}
      <section className="mx-auto max-w-6xl border-t border-black/[0.06] px-6 py-16 md:py-20">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase" style={mono}>
                The Numbers
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] md:text-4xl" style={inter}>
                Adoption, industry by industry.
              </h2>
            </div>
            <p className="text-[11px] text-[#111111]/50" style={inter}>
              Compiled from published industry surveys · Updated July 2026
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {industries.map((ind) => (
              <button
                key={ind}
                onClick={() => setFilter(ind)}
                className={`rounded-full px-5 py-2 text-[11.5px] transition-all duration-200 ${
                  filter === ind
                    ? "bg-[#111111] text-white"
                    : "border border-black/10 bg-white text-[#111111]/60 hover:border-[#111111]/40 hover:text-[#111111]"
                }`}
                style={inter}
              >
                {ind}
              </button>
            ))}
          </div>
        </Reveal>
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((s, i) => (
            <Reveal key={s.industry} delay={i * 0.04}>
              <div className="h-full rounded-2xl border border-black/[0.07] bg-white p-6">
                <p className="text-[10px] tracking-[0.24em] text-[#1e6b3c] uppercase" style={mono}>
                  {s.industry}
                </p>
                <p className="mt-2 text-5xl font-semibold tracking-[-0.04em]" style={inter}>
                  <CountUp target={s.pct} />
                </p>
                <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-black/[0.06]">
                  <div className="h-full rounded-full bg-[#1e6b3c]" style={{ width: `${s.pct}%` }} />
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-[#111111]/55" style={inter}>
                  {s.line}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* from the desk */}
      <section className="mx-auto max-w-6xl border-t border-black/[0.06] px-6 py-16 md:py-20">
        <Reveal>
          <p className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase" style={mono}>
            From the Desk
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] md:text-4xl" style={inter}>
            What we're telling clients this quarter.
          </h2>
        </Reveal>
        {/* featured */}
        <Reveal delay={0.06}>
          <article className="mt-8 grid grid-cols-1 overflow-hidden rounded-2xl border border-black/[0.07] bg-white md:grid-cols-[380px_minmax(0,1fr)]">
            <div className="border-b border-black/[0.05] bg-[#FAFAF8] md:border-r md:border-b-0">
              <img src="/assets/pillar_consult.jpg" alt="" loading="lazy" className="h-full min-h-[220px] w-full object-cover" />
            </div>
            <div className="p-7 md:p-9">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-[#1e6b3c]/10 px-3 py-1 text-[10px] tracking-[0.2em] text-[#1e6b3c] uppercase" style={mono}>
                  {featured.tag}
                </span>
                <span className="text-[11px] text-[#111111]/55" style={inter}>{readTime(featured.body)}</span>
              </div>
              <h3 className="mt-3 text-[22px] leading-snug font-semibold tracking-[-0.02em] md:text-[26px]" style={inter}>
                {featured.title}
              </h3>
              <p className="mt-3 line-clamp-4 text-[14px] leading-relaxed text-[#111111]/55" style={inter}>
                {featured.body}
              </p>
              <div className="mt-5 flex items-center gap-3">
                <img src={AUTHORS[featured.tag]?.photo} alt="" className="h-9 w-9 rounded-full border border-black/[0.06] object-cover" />
                <p className="text-[12.5px] text-[#111111]/60" style={inter}>{AUTHORS[featured.tag]?.name}</p>
              </div>
            </div>
          </article>
        </Reveal>
        {/* the rest */}
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {rest.map((a, i) => (
            <Reveal key={a.title} delay={0.05 + i * 0.04}>
              <article className="flex h-full flex-col rounded-2xl border border-black/[0.07] bg-white p-7 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#1e6b3c]/30">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-[#1e6b3c]/10 px-3 py-1 text-[10px] tracking-[0.2em] text-[#1e6b3c] uppercase" style={mono}>
                    {a.tag}
                  </span>
                  <span className="text-[11px] text-[#111111]/55" style={inter}>{readTime(a.body)}</span>
                </div>
                <h3 className="mt-3 text-[18px] leading-snug font-semibold tracking-[-0.015em]" style={inter}>
                  {a.title}
                </h3>
                <p className="mt-2.5 line-clamp-3 flex-1 text-[13.5px] leading-relaxed text-[#111111]/55" style={inter}>
                  {a.body}
                </p>
                <div className="mt-4 flex items-center gap-2.5">
                  <img src={AUTHORS[a.tag]?.photo} alt="" className="h-8 w-8 rounded-full border border-black/[0.06] object-cover" />
                  <p className="text-[12px] text-[#111111]/55" style={inter}>{AUTHORS[a.tag]?.name}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* case studies */}
      <section className="mx-auto max-w-6xl border-t border-black/[0.06] px-6 py-16 md:py-20">
        <Reveal>
          <p className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase" style={mono}>
            In the Field
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] md:text-4xl" style={inter}>
            Before and after.
          </h2>
        </Reveal>
        <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {CASES.map((c, i) => (
            <Reveal key={c.client} delay={i * 0.05}>
              <div className="flex h-full flex-col rounded-2xl border border-black/[0.07] bg-white p-7">
                <p className="text-[10px] tracking-[0.24em] text-[#1e6b3c] uppercase" style={mono}>
                  {c.tag}
                </p>
                <h3 className="mt-2 text-[16.5px] font-semibold tracking-[-0.015em]" style={inter}>
                  {c.client}
                </h3>
                <div className="mt-4 space-y-3 text-[13.5px] leading-relaxed" style={inter}>
                  <p className="text-[#111111]/55">
                    <span className="mr-2 text-[10px] tracking-[0.2em] uppercase" style={mono}>Before</span>
                    {c.before}
                  </p>
                  <p className="text-[#111111]/70">
                    <span className="mr-2 text-[10px] tracking-[0.2em] text-[#1e6b3c] uppercase" style={mono}>After</span>
                    {c.after}
                  </p>
                </div>
                <p className="mt-auto pt-5 text-[22px] font-semibold tracking-[-0.02em] text-[#1e6b3c]" style={inter}>
                  {c.metric}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <p className="mt-4 text-[11px] text-[#111111]/50" style={inter}>
            Representative engagements — anonymized where clients prefer it. References on request.
          </p>
        </Reveal>
      </section>

      {/* roi calculator */}
      <section className="mx-auto max-w-6xl border-t border-black/[0.06] px-6 py-16 md:py-20">
        <Reveal>
          <p className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase" style={mono}>
            Do the Math
          </p>
          <h2 className="mt-3 max-w-xl text-2xl font-semibold tracking-[-0.035em] md:text-4xl" style={inter}>
            What is repetitive work costing you?
          </h2>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="mt-8">
            <RoiCalculator />
          </div>
        </Reveal>
      </section>

      {/* final cta */}
      <section className="bg-[#070907] px-6 py-24 text-center text-[#F5F5F3]">
        <Reveal>
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-[-0.035em] md:text-5xl" style={inter}>
            Your competitors are already in here.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] text-white/50" style={inter}>
            Book your map — 20 minutes, no pitch, a straight answer on where
            AI pays off for you.
          </p>
          <a
            href="/contact"
            className="mt-8 inline-block rounded-full bg-[#2e9e58] px-10 py-5 text-[13px] font-bold tracking-[0.22em] text-white uppercase transition-all hover:bg-white hover:text-[#111111]"
            style={mono}
          >
            Book Free Strategy Call →
          </a>
        </Reveal>
      </section>
    </main>
  );
}
