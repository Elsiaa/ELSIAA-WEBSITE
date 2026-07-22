import { useEffect, useRef, useState } from "react";
import { AssemblingArtist } from "./AssemblingArtist";
import { LiveGraphic } from "./LiveGraphic";
import { WorkingRobot } from "./WorkingRobot";
import { ScrollGlobe, CountTo } from "./ScrollGlobe";
import { Reveal } from "./Reveal";
import { WhyBrandsChose } from "./BrandLogos";
import { SoftwareDemos } from "./SoftwareDemos";

/* ============================================================
   ELSIAA homepage — built from Isya's notebook sketch 06/20/26
   Mobile-first: graphic block + title + subcategory card
   carousel per division, consultation pricing, locations, team.
   ============================================================ */

/* ---------- global scroll progress — thin emerald line above everything ---------- */
function ScrollProgress() {
  const [w, setW] = useState(0);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = document.documentElement;
        const max = h.scrollHeight - h.clientHeight;
        setW(max > 0 ? (h.scrollTop / max) * 100 : 0);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div className="fixed inset-x-0 top-0 z-[60] h-[2px] bg-transparent">
      <div
        className="h-full bg-[#1e6b3c] transition-[width] duration-150 ease-out"
        style={{ width: `${w}%` }}
      />
    </div>
  );
}

/* ---------- scroll parallax: gentle vertical drift while the element crosses the viewport ---------- */
function Parallax({ children, amount = 26 }: { children: React.ReactNode; amount?: number }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const progress = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
        el.style.transform = `translateY(${(-progress * amount).toFixed(1)}px)`;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [amount]);
  return <div ref={ref} style={{ willChange: "transform" }}>{children}</div>;
}


/* ---------- shared row carousel: arrows + swipe + gentle drift ---------- */
function Rail({
  children,
  drift = 0.35,
}: {
  children: React.ReactNode;
  drift?: number;
}) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const paused = useRef(false);
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollLeft = 0; // always open on a clean first card
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let pos = 0;
    let startAt = performance.now() + 2200; // settle before drifting
    rail.addEventListener("scroll", () => {
      if (Math.abs(rail.scrollLeft - pos) > 2) pos = rail.scrollLeft;
    });
    const tick = () => {
      if (!paused.current && performance.now() > startAt) {
        pos += drift;
        const half = rail.scrollWidth / 2;
        if (pos >= half) pos -= half;
        rail.scrollLeft = pos;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [drift]);
  const nudge = (d: number) =>
    railRef.current?.scrollBy({ left: d * 300, behavior: "smooth" });
  return (
    // full-bleed: the rail breaks out of the page container and runs to ~2mm
    // from each screen edge; cards fade in/out through the edge masks below
    <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 px-2">
      <button
        aria-label="Previous"
        onClick={() => nudge(-1)}
        className="absolute top-1/2 left-1 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/95 text-[#111111] shadow-md backdrop-blur transition-all hover:border-[#1e6b3c] hover:bg-[#1e6b3c] hover:text-white"
      >
        ←
      </button>
      <button
        aria-label="Next"
        onClick={() => nudge(1)}
        className="absolute top-1/2 right-1 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/95 text-[#111111] shadow-md backdrop-blur transition-all hover:border-[#1e6b3c] hover:bg-[#1e6b3c] hover:text-white"
      >
        →
      </button>
      <div
        ref={railRef}
        onPointerEnter={() => (paused.current = true)}
        onPointerLeave={() => (paused.current = false)}
        onTouchStart={() => (paused.current = true)}
        onTouchEnd={() => (paused.current = false)}
        className="flex gap-3 overflow-x-auto px-2 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0, black 84px, black calc(100% - 84px), transparent 100%)",
          maskImage:
            "linear-gradient(to right, transparent 0, black 84px, black calc(100% - 84px), transparent 100%)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ---------- one division row: graphic + title + subcategory cards ---------- */
export type Sub = { name: string; items: string[] };

function DivisionRow({
  n,
  title,
  lede,
  img,
  graphic,
  subs,
  href,
  cta,
  extra,
}: {
  n: string;
  title: string;
  lede: string;
  img?: string;
  graphic?: React.ReactNode;
  subs: Sub[];
  href: string;
  cta?: string;
  extra?: React.ReactNode;
}) {
  return (
    <section className="border-t border-black/[0.06] bg-white py-16 md:py-24">
      <div className="mx-auto w-full max-w-6xl px-6">
        {/* header + graphic — one clean composed row */}
        <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-[minmax(0,1fr)_640px] md:gap-6">
          <Reveal className="order-2 md:order-1">
            <p
              className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase"
              style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
            >
              {n} · Division
            </p>
            <h2
              className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-[#111111] md:text-5xl"
              style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
            >
              {title}
            </h2>
            <p
              className="mt-3 max-w-md text-[15px] text-[#111111]/60"
              style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
            >
              {lede}
            </p>
            <a
              href={href}
              className="mt-5 inline-block text-[11px] tracking-[0.24em] text-[#1e6b3c] uppercase hover:underline"
              style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
            >
              {cta ?? "Explore"} ↗
            </a>
          </Reveal>
          <Reveal className="order-1 md:order-2">
            <Parallax>
            <a href={href} className="group block bg-white">
              {graphic ?? (
                <img
                  src={img}
                  alt={title}
                  loading="lazy"
                  className="aspect-[3/2] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
              )}
            </a>
            </Parallax>
          </Reveal>
        </div>
        {/* the catalog — every group once, no repeats */}
        <Reveal delay={0.1}>
        <div className="mt-10">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {subs.map((s, i) => (
              <a
                key={`${s.name}-${i}`}
                href={href}
                className="group flex flex-col rounded-xl border border-black/[0.07] bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#1e6b3c]/35 hover:shadow-[0_18px_44px_-30px_rgba(17,17,17,0.3)]"
              >
                <div className="flex items-center justify-between">
                  <h3
                    className="text-[13.5px] font-semibold tracking-[-0.01em] text-[#111111]"
                    style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
                  >
                    {s.name}
                  </h3>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-black/10 text-[12px] text-[#111111]/60 transition-all group-hover:border-[#1e6b3c] group-hover:bg-[#1e6b3c] group-hover:text-white">
                    →
                  </span>
                </div>
                <ul className="mt-2.5 space-y-1">
                  {s.items.map((it) => (
                    <li
                      key={it}
                      className="text-[12px] leading-snug text-[#111111]/55"
                      style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
                    >
                      {it}
                    </li>
                  ))}
                </ul>
              </a>
            ))}
          </div>
        </div>
        </Reveal>
        {extra}
      </div>
    </section>
  );
}


/* ---------- AI industry statistics ---------- */
const STATS = [
  { pct: 78, industry: "All industries", line: "of organizations already run AI in at least one business function. The other 22% are competing against it." },
  { pct: 66, industry: "Healthcare", line: "of physicians already practice with AI at their side. Medicine didn't wait for permission." },
  { pct: 91, industry: "Finance", line: "of financial firms are deploying or assessing AI right now. The desks that aren't are being priced out." },
  { pct: 71, industry: "Marketing", line: "of marketing teams ship with generative AI weekly. Entire creative departments, compressed into a prompt." },
  { pct: 63, industry: "Retail", line: "of retailers already bank revenue they attribute to AI. The registers learned faster than the staff." },
  { pct: 55, industry: "Manufacturing", line: "of manufacturers run AI on the production floor. The night shift doesn't sleep anymore — it computes." },
];

/* Renders the FINAL percentage by default (SSR, crawlers, reduced motion) and
   only animates from 0 as an enhancement — a missed trigger can never leave
   a stat stuck at 0%. */
function CountUp({ target }: { target: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(target);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return; // keep the final value
    }
    let raf = 0;
    let watchdog = 0;
    const dur = 1400;
    const run = () => {
      const t0 = performance.now();
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
      { threshold: 0.4 }
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
      {val}%
    </span>
  );
}

/* ---------- the opener: the world changed — hero + the count, one dark screen ---------- */
function HomeHero() {
  return (
    <section className="flex min-h-screen flex-col justify-between bg-white pt-8 pb-8 md:pt-10">
      <div className="mx-auto mb-4 w-full max-w-6xl px-6">
        <p
          className="border-b border-black/[0.06] pb-3 text-center text-[10px] tracking-[0.26em] text-[#111111]/55 uppercase"
          style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
        >
          6 Cities · Fully Insured Builds · 24/7 Support
        </p>
      </div>
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-[minmax(0,1fr)_400px]">
          <Reveal>
            <p
              className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase"
              style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
            >
              ELSIAA · AI Done Better
            </p>
            <h1
              className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-[#111111] md:text-5xl"
              style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
            >
              The world changed.
              <span className="text-[#1e6b3c]"> AI is here.</span>
            </h1>
            <p
              className="mt-4 max-w-xl text-[15px] leading-relaxed text-[#111111]/55 md:text-[16px]"
              style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
            >
              We put AI to work in your business — real automation,
              world-class design, custom software, and strategy that delivers
              results.
            </p>
            <p
              className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-[#111111]/75"
              style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
            >
              <span className="font-semibold text-[#111111]">78% of companies already run AI</span>{" "}
              in at least one function.{" "}
              <span className="text-[#1e6b3c]">The other 22% are competing against it.</span>
            </p>
            <p
              className="mt-3 text-[11px] tracking-[0.22em] text-[#111111]/55 uppercase"
              style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
            >
              Healthcare · Finance · Marketing · Retail · Manufacturing
            </p>
            <a
              href="/contact"
              className="mt-6 inline-block rounded-full bg-[#1e6b3c] px-8 py-3.5 text-[12px] font-bold tracking-[0.2em] text-white uppercase transition-all duration-300 hover:bg-[#111111]"
              style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
            >
              Book Free 20-Min Strategy Call →
            </a>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="hidden md:block">
              <ScrollGlobe size={400} />
              <div className="mt-2 flex items-start justify-center gap-10">
                {[
                  { n: 6, suffix: "", label: "Cities on site" },
                  { n: 3, suffix: "", label: "Continents" },
                  { n: 24, suffix: "/7", label: "Support" },
                ].map((st) => (
                  <div key={st.label} className="text-center">
                    <p
                      className="text-2xl font-semibold tracking-[-0.03em] text-[#111111]"
                      style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
                    >
                      <CountTo target={st.n} suffix={st.suffix} />
                    </p>
                    <p
                      className="mt-1 text-[10px] tracking-[0.24em] text-[#111111]/55 uppercase"
                      style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
                    >
                      {st.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      {/* the count — live adoption, industry by industry */}
      <div className="mt-8">
        <div className="mx-auto w-full max-w-6xl px-6">
          <Reveal>
            <div className="flex items-baseline justify-between gap-4">
              <p
                className="text-[12px] tracking-[0.28em] text-[#111111]/55 uppercase"
                style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
              >
                Right now, while you read this
              </p>
              <a
                href="/insights"
                className="flex-none text-[11px] tracking-[0.24em] text-[#1e6b3c] uppercase hover:underline"
                style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
              >
                Read the research ↗
              </a>
            </div>
          </Reveal>
        </div>
        <div className="mx-auto mt-5 w-full max-w-6xl px-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {STATS.slice(1, 5).map((st) => (
              <a
                key={st.industry}
                href="/insights"
                className="group flex flex-col rounded-xl border border-black/[0.07] bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#1e6b3c]/40"
              >
                <span
                  className="text-[10px] tracking-[0.24em] text-[#1e6b3c] uppercase"
                  style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
                >
                  {st.industry}
                </span>
                <span
                  className="mt-1.5 text-4xl font-semibold tracking-[-0.04em] text-[#111111]"
                  style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
                >
                  <CountUp target={st.pct} />
                </span>
                <p
                  className="mt-2 text-[12px] leading-relaxed text-[#111111]/55"
                  style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
                >
                  {st.line}
                </p>
              </a>
            ))}
          </div>
        </div>
        <div className="mx-auto w-full max-w-6xl px-6">
          <Reveal>
            <p
              className="mt-4 text-[13.5px] text-[#111111]/60"
              style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
            >
              The question isn't whether AI takes the work — it's who's
              holding it when it does.{" "}
              <a href="/contact" className="font-medium text-[#1e6b3c] hover:underline">
                Make sure it's you →
              </a>
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function HeroCards() {
  const items = [
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e6b3c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M8.5 12.5 11 15l4.5-6" />
        </svg>
      ),
      title: "Built different.",
      body: "If your team can run the process, we can teach a model to run it better — sales, operations, medicine, law, anything.",
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e6b3c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-3.6 8-10V5l-8-3-8 3v7c0 6.4 8 10 8 10Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      ),
      title: "No bugs. No data hacks. Fully insured.",
      body: "Every solution ships hardened, tested, and covered. Certificate of insurance available on request. Most vendors can't say the same.",
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e6b3c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 17l6-6 4 4 8-8" />
          <path d="M14 7h7v7" />
        </svg>
      ),
      title: "Outcomes, not experiments.",
      body: "Scoped plans, fixed prices, measured results — automation built to pay for itself.",
    },
  ];
  return (
    <section className="border-t border-black/[0.06] bg-white py-14 md:py-20">
      <div className="mx-auto w-full max-w-6xl px-6">
        <Reveal>
          <p
            className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase"
            style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
          >
            Why ELSIAA
          </p>
        </Reveal>
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          {items.map((it, i) => (
            <Reveal key={it.title} delay={0.05 + i * 0.05}>
              <div className="h-full rounded-2xl border border-black/[0.07] bg-white p-7 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#1e6b3c]/35">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1e6b3c]/10">
                  {it.icon}
                </span>
                <h2
                  className="mt-4 text-[17px] font-semibold tracking-[-0.02em] text-[#111111]"
                  style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
                >
                  {it.title}
                </h2>
                <p
                  className="mt-2 text-[14px] leading-relaxed text-[#111111]/55"
                  style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
                >
                  {it.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- data: the full catalog ---------- */
export const DESIGN: Sub[] = [
  { name: "Web", items: ["Website Design", "UI/UX Design", "Landing Pages", "SaaS Interfaces", "E-commerce Design", "Dashboard Design"] },
  { name: "Apps", items: ["Mobile App Design", "iOS & Android UI", "App Store Assets"] },
  { name: "Branding", items: ["Branding & Logo Design", "Brand Identity", "Packaging Design", "Print Design"] },
  { name: "Marketing", items: ["Marketing Graphics", "Social Media Graphics", "Motion Graphics", "Presentation Design"] },
  { name: "Product", items: ["3D Product Renders", "Product Staging", "Commercial Imagery"] },
];
export const AUTOMATION: Sub[] = [
  { name: "Sales", items: ["CRM Automation", "Lead Qualification", "Proposal Generation", "Appointment Booking", "Quote Follow-ups", "Pipeline Alerts"] },
  { name: "Operations", items: ["Internal Business Automation", "Document Processing", "Data Entry Automation", "Web Scraping", "API Integrations", "Zapier / Make Automation", "Inventory Sync", "Meeting Notes → CRM"] },
  { name: "Customer Support", items: ["Customer Follow-up", "Email Automation", "Slack & Discord Bots", "Ticket Triage & Routing", "Review Management"] },
  { name: "Finance", items: ["Invoice Automation", "Reporting Dashboards", "Payroll Automation", "Expense Processing", "Payment Reminders"] },
  { name: "Marketing", items: ["Social Posting Automation", "Ad Performance Reports", "Newsletter Automation"] },
  { name: "HR", items: ["Recruiting Screening", "Employee Onboarding"] },
  { name: "AI", items: ["AI Workflow Automation", "AI Agents & Assistants"] },
];
export const SOFTWARE: Sub[] = [
  { name: "Web", items: ["Custom Web Applications", "SaaS Development", "Client Portals"] },
  { name: "Mobile", items: ["iOS Apps", "Android Apps"] },
  { name: "Enterprise", items: ["Internal Company Software", "Employee Dashboards", "Inventory Systems", "CRM Development", "ERP Systems"] },
  { name: "AI", items: ["AI Applications", "AI Chatbots"] },
  { name: "Infrastructure", items: ["API Development", "Database Architecture", "Cloud Infrastructure", "Maintenance & Support"] },
];
export const CONSULTATION: Sub[] = [
  { name: "Strategy", items: ["1-on-1 Strategy Calls", "AI Implementation Consulting", "Digital Transformation"] },
  { name: "Technology", items: ["Software Architecture Review", "Technical Due Diligence", "CTO Advisory", "Code Reviews"] },
  { name: "Business", items: ["Business Process Audits", "Automation Planning", "Team Training", "Ongoing Monthly Advisory"] },
  { name: "Product", items: ["Product Roadmapping", "Startup MVP Planning", "UX Audits"] },
  { name: "Growth", items: ["Marketing Strategy", "Funnel & Conversion Advisory"] },
];

/* ---------- merged: automation + software, one carousel ---------- */
export const AUTOSOFT: Sub[] = (() => {
  const m = new Map<string, string[]>();
  for (const g of [...AUTOMATION, ...SOFTWARE]) {
    m.set(g.name, [...(m.get(g.name) ?? []), ...g.items.filter((it) => !(m.get(g.name) ?? []).includes(it))]);
  }
  return [...m.entries()].map(([name, items]) => ({ name, items }));
})();

/* ---------- consultation pricing (stripe-ready tiers) ---------- */
const TIERS = [
  {
    name: "Basic",
    price: "$350",
    unit: "one session",
    pitch: "A 1-on-1 strategy call plus a written action plan. The fastest way to know exactly what to build.",
    features: ["60-minute call with leadership", "Business & process audit", "Written recommendations in 48h"],
    featured: false,
  },
  {
    name: "Sprint",
    price: "$1,850",
    unit: "two weeks",
    pitch: "We don't just advise — we implement the first automation or design fix with you.",
    features: ["Everything in Basic", "Hands-on implementation", "Two review sessions", "Team walkthrough"],
    featured: true,
  },
  {
    name: "Advisory",
    price: "Custom",
    unit: "monthly",
    pitch: "ELSIAA as your standing technology counsel — architecture, roadmap, and vendor decisions.",
    features: ["Ongoing monthly advisory", "Priority access to leadership", "Quarterly roadmap reviews"],
    featured: false,
  },
];

function ConsultPricing() {
  return (
    <div className="mt-10">
      <h3
        className="text-[11px] tracking-[0.28em] text-[#111111]/55 uppercase"
        style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
      >
        Engagements
      </h3>
      <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
        {TIERS.map((t) => (
          <div
            key={t.name}
            className={`flex flex-col rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 ${
              t.featured
                ? "border-[#1e6b3c] bg-[#111111] text-white shadow-[0_30px_70px_-30px_rgba(30,107,60,0.55)]"
                : "border-black/[0.08] bg-white text-[#111111] shadow-[0_18px_44px_-30px_rgba(17,17,17,0.35)]"
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-semibold" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}>
                {t.name}
              </h3>
              {t.featured && (
                <span
                  className="rounded-full bg-[#2e9e58] px-2.5 py-1 text-[10px] font-bold tracking-[0.18em] text-white uppercase"
                  style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
                >
                  Most chosen
                </span>
              )}
            </div>
            <p className="mt-3">
              <span className="text-2xl font-semibold tracking-[-0.03em]" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}>
                {t.price}
              </span>
              <span className={`ml-2 text-[12px] ${t.featured ? "text-white/50" : "text-black/55"}`}>/ {t.unit}</span>
            </p>
            <p
              className={`mt-2.5 text-[12.5px] leading-relaxed ${t.featured ? "text-white/65" : "text-black/55"}`}
              style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
            >
              {t.pitch}
            </p>
            <ul className="mt-4 flex-1 space-y-2">
              {t.features.map((f) => (
                <li key={f} className={`flex gap-2 text-[12.5px] ${t.featured ? "text-white/80" : "text-black/65"}`}>
                  <span className="text-[#2e9e58]">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <a
              href="/consultation"
              className={`mt-4 rounded-full px-4 py-2.5 text-center text-[11px] font-bold tracking-[0.18em] uppercase transition-all ${
                t.featured
                  ? "bg-[#2e9e58] text-white hover:bg-white hover:text-[#111111]"
                  : "border border-[#111111]/20 text-[#111111] hover:border-[#1e6b3c] hover:bg-[#1e6b3c] hover:text-white"
              }`}
              style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
            >
              Book {t.name} →
            </a>
          </div>
        ))}
      </div>
      <p className="mt-2.5 text-[11px] text-black/50" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}>
        Book directly on the consultation page — first call free, confirmation by email within hours.
      </p>
    </div>
  );
}

/* ---------- locations — the city desk: live clocks, one active city ---------- */
const CITIES = [
  { name: "New York City", q: "Manhattan, New York", flag: "us", tz: "America/New_York", art: "/assets/cityart/nyc.jpg" },
  { name: "London", q: "London, UK", flag: "gb", tz: "Europe/London", art: "/assets/cityart/london.jpg" },
  { name: "Geneva", q: "Geneva, Switzerland", flag: "ch", tz: "Europe/Zurich", art: "/assets/cityart/geneva.jpg" },
  { name: "Antwerp", q: "Antwerp, Belgium", flag: "be", tz: "Europe/Brussels", art: "/assets/cityart/antwerp.jpg" },
  { name: "Tel Aviv", q: "Tel Aviv, Israel", flag: "il", tz: "Asia/Jerusalem", art: "/assets/cityart/telaviv.jpg" },
  { name: "Los Angeles", q: "Los Angeles, California", flag: "us", tz: "America/Los_Angeles", art: "/assets/cityart/la.jpg" },
];

function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function cityTime(now: Date | null, tz: string) {
  if (!now) return "--:--:--";
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: tz,
  }).format(now);
}

function cityDay(now: Date | null, tz: string) {
  if (!now) return "···";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: tz,
  }).format(now);
}

function Locations() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const now = useNow();
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % CITIES.length), 6000);
    return () => clearInterval(t);
  }, [paused]);
  const active = CITIES[idx];
  const mono = { fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" } as const;
  const inter = { fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" } as const;
  return (
    <section
      className="relative overflow-hidden border-t border-black/[0.06] bg-white py-16 text-[#111111] md:py-24"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* skyline backdrop — bright, anchored bottom-right, crossfading */}
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[68%] md:block">
        {CITIES.map((c, i) => (
          <img
            key={c.name}
            src={c.art}
            alt=""
            loading={i === 0 ? "eager" : "lazy"}
            className={`absolute inset-0 h-full w-full object-contain object-right-bottom transition-opacity duration-[1400ms] ${
              i === idx ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/25 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <Reveal>
          <p className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase" style={mono}>
            05 · Locations
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] md:text-4xl" style={inter}>
            One standard. Every timezone.
          </h2>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed text-[#111111]/55" style={inter}>
            <span className="font-semibold text-[#111111]">24/7 virtual support</span> — and
            in person, on site, in six cities. Right now it's{" "}
            <span className="font-semibold text-[#1e6b3c]">{cityTime(now, active.tz).slice(0, 5)}</span>{" "}
            in {active.name}.
          </p>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,420px)_1fr]">
          {/* the city desk — live clocks */}
          <Reveal delay={0.08}>
            <div role="tablist" aria-label="ELSIAA cities">
              {CITIES.map((c, i) => (
                <button
                  key={c.name}
                  role="tab"
                  aria-selected={i === idx}
                  onClick={() => setIdx(i)}
                  className={`group flex w-full items-center gap-4 border-b border-black/[0.06] py-3.5 text-left transition-all duration-300 ${
                    i === idx ? "" : "opacity-45 hover:opacity-80"
                  }`}
                >
                  <span
                    className={`h-8 w-[3px] flex-none rounded-full transition-colors duration-300 ${
                      i === idx ? "bg-[#1e6b3c]" : "bg-black/[0.08]"
                    }`}
                  />
                  <img
                    src={`/assets/flags/${c.flag}.png`}
                    srcSet={`/assets/flags/${c.flag}@2x.png 2x`}
                    alt=""
                    className="h-[13px] w-[19px] flex-none rounded-[2px] object-cover ring-1 ring-black/10"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15.5px] font-semibold tracking-[-0.01em]" style={inter}>
                      {c.name}
                    </span>
                    <span
                      className={`block text-[10px] tracking-[0.22em] uppercase transition-colors ${
                        i === idx ? "text-[#1e6b3c]" : "text-[#111111]/50"
                      }`}
                      style={mono}
                    >
                      {i === idx ? "On site now" : "ELSIAA office"}
                    </span>
                  </span>
                  <span className="text-right">
                    <span
                      className={`block text-[17px] font-medium tabular-nums transition-colors ${
                        i === idx ? "text-[#111111]" : "text-[#111111]/55"
                      }`}
                      style={mono}
                    >
                      {cityTime(now, c.tz)}
                    </span>
                    <span className="block text-[10px] tracking-[0.22em] text-[#111111]/50 uppercase" style={mono}>
                      {cityDay(now, c.tz)} · local
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </Reveal>

          {/* open air — the skyline owns this side */}
          <div className="hidden md:block" aria-hidden />
        </div>

        {/* map on demand — never blocks the art */}
        <Reveal delay={0.14}>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={() => setShowMap((v) => !v)}
              className="rounded-full border border-black/12 bg-white/80 px-6 py-2.5 text-[10.5px] font-bold tracking-[0.22em] text-[#111111] uppercase backdrop-blur transition-all hover:border-[#1e6b3c] hover:text-[#1e6b3c]"
              style={mono}
            >
              {showMap ? "Hide map" : `Map of ${active.name}`} {showMap ? "↑" : "↓"}
            </button>
            <a
              href={`https://maps.google.com/maps?q=${encodeURIComponent(active.q)}`}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] tracking-[0.24em] text-[#1e6b3c] uppercase hover:underline"
              style={mono}
            >
              Open in Google Maps ↗
            </a>
          </div>
          <div
            className="overflow-hidden transition-all duration-500 ease-out"
            style={{ maxHeight: showMap ? 260 : 0, opacity: showMap ? 1 : 0 }}
          >
            <div className="mt-4 overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-[0_24px_60px_-45px_rgba(17,17,17,0.4)]">
              {showMap && (
                <iframe
                  key={active.name}
                  title={`Map — ${active.name}`}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(active.q)}&z=11&output=embed`}
                  loading="lazy"
                  className="h-[220px] w-full grayscale-[0.25]"
                  style={{ border: 0 }}
                />
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- team ---------- */
const TEAM = [
  { name: "Yisrael Krug", role: "Founder & Chief Executive Officer", init: "YK", photo: "/assets/team/yk.jpg" },
  { name: "David Heimowitz", role: "Co-Founder & Chief Technology Officer", init: "DH", photo: "/assets/team/dh.jpg" },
  { name: "Jacob Rubelow", role: "Executive Legal & Strategic Counsel", init: "JR", photo: "/assets/team/jr.jpg" },
  { name: "Chaim Lieberman", role: "Director of European Business", init: "CL", photo: "/assets/team/cl.jpg" },
  { name: "Izzy Eisenberg", role: "Director of California Business", init: "IE", photo: "/assets/team/ie.jpg" },
  { name: "Ynon Azulai", role: "AI & Technology Expert · Jerusalem", init: "YA", photo: "/assets/team/ya.jpg" },
  { name: "Mendel Parnas", role: "Chairman & Advisor · Insurance Expert", init: "MP", photo: "/assets/team/mp.jpg" },
  { name: "Berel Krug", role: "Executive Advisor · Healthcare Consultant", init: "BK", photo: "/assets/team/bk.jpg" },
  { name: "Dr. Esther Krug, MD", role: "Professor of Medicine, Johns Hopkins University", init: "EK", photo: "/assets/team/ek.jpg" },
  { name: "Dr. Edward Margolin, MD", role: "Professor of Medicine, University of Toronto", init: "EM", photo: "/assets/team/em.jpg" },
];

function Team() {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-6">
        <Reveal>
          <p
            className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase"
            style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
          >
            04 · Who we are
          </p>
          <h2
            className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-[#111111] md:text-4xl"
            style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
          >
            Leadership of consequence.
          </h2>
          <p
            className="mt-3 max-w-xl text-[15px] text-[#111111]/60"
            style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
          >
            Founders, executives, and tenured professors — decades of academic
            distinction and enterprise success at one table.
          </p>
        </Reveal>
        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TEAM.slice(0, 6).map((m, i) => (
            <Reveal key={m.name} delay={i * 0.05}>
              <div className="group flex items-center gap-3.5 rounded-xl border border-black/[0.07] bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#1e6b3c]/35">
                <img
                  src={m.photo}
                  alt={m.name}
                  loading="lazy"
                  className="flex-none rounded-full border border-black/[0.06] object-cover"
                  style={{ width: 52, height: 52 }}
                />
                <div>
                  <h3 className="text-[15px] font-semibold text-[#111111]" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}>
                    {m.name}
                  </h3>
                  <p className="mt-0.5 text-[12px] text-[#111111]/60" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}>
                    {m.role}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <a
            href="/team"
            className="mt-8 inline-flex items-center gap-3 rounded-full border border-[#111111]/15 px-7 py-3.5 text-[11px] font-bold tracking-[0.22em] text-[#111111] uppercase transition-all duration-300 hover:border-[#1e6b3c] hover:bg-[#1e6b3c] hover:text-white"
            style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
          >
            Meet the leadership →
          </a>
        </Reveal>
      </div>
    </section>
  );
}


/* ---------- the merch strip: one clean line + carousel ---------- */
const MERCH = [
  { img: "/assets/store/dtd_fitted_black.jpg", name: "Fitted Professional Tee", price: "$68" },
  { img: "/assets/store/dtd_tailored_white.jpg", name: "Tailored Casual Tee", price: "$64" },
  { img: "/assets/store/dtd_oversized_grey.jpg", name: "Relaxed Oversized Tee", price: "$72" },
  { img: "/assets/store/merch_pants.jpg", name: "ELSIAA Pants", price: "$118" },
  { img: "/assets/store/city_ny_cobalt.jpg", name: "New York Hoodie", price: "$188" },
  { img: "/assets/store/city_la_coral.jpg", name: "Los Angeles Tee", price: "$148" },
  { img: "/assets/store/city_ldn_lilac.jpg", name: "London Crewneck", price: "$178" },
  { img: "/assets/store/city_zrh_swiss.jpg", name: "Zürich Tee", price: "$168" },
  { img: "/assets/store/merch_tlv.jpg", name: "Tel Aviv Tee", price: "$148" },
  { img: "/assets/store/om_ivory.jpg", name: "Old Money Tee — Ivory", price: "$128" },
  { img: "/assets/store/om_navy.jpg", name: "Old Money Tee — Navy", price: "$128" },
  { img: "/assets/store/obj_mug.jpg", name: "Black Mug", price: "$28" },
  { img: "/assets/store/obj_cap.jpg", name: "Cap", price: "$48" },
  { img: "/assets/store/obj_tote.jpg", name: "Tote", price: "$42" },
];

function MerchStrip() {
  return (
    <section className="border-t border-black/[0.06] bg-white py-16 md:py-24">
      <div className="mx-auto w-full max-w-6xl px-6">
        <Reveal>
          <p
            className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase"
            style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
          >
            06 · The Store
          </p>
          <h2
            className="mt-2 max-w-2xl text-2xl font-semibold tracking-[-0.035em] text-[#111111] md:text-3xl"
            style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
          >
            The ELSIAA Store.
          </h2>
          <p
            className="mt-3 max-w-md text-[15px] text-[#111111]/60"
            style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
          >
            You asked where we got our merch. Here it is.
          </p>
          <a
            href="/store"
            className="mt-5 inline-block text-[11px] tracking-[0.24em] text-[#1e6b3c] uppercase hover:underline"
            style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
          >
            Shop the store ↗
          </a>
        </Reveal>
      </div>
      <Reveal delay={0.08}>
      <div className="mt-8">
        <div className="flex gap-3 overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {MERCH.slice(0, 8).map((m, i) => (
            <a
              key={`${m.name}-${i}`}
              href="/store"
              className="group w-[170px] flex-none"
            >
              <div className="overflow-hidden rounded-xl border border-black/[0.06] bg-white">
                <img
                  src={m.img}
                  alt={m.name}
                  loading="lazy"
                  className="aspect-[3/4] w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                />
              </div>
              <div className="mt-2.5 flex items-baseline justify-between px-0.5">
                <p className="text-[13.5px] font-semibold text-[#111111]" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}>{m.name}</p>
                <p className="text-[12.5px] text-[#111111]/60" style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}>{m.price}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
      </Reveal>
    </section>
  );
}

/* ---------- closing CTA — the next step, unmissable ---------- */
function FinalCTA() {
  return (
    <section className="border-t border-black/[0.06] bg-[#0c0c0c] py-20 text-white md:py-28">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <Reveal>
          <p
            className="text-[10px] tracking-[0.32em] text-[#2e9e58] uppercase"
            style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
          >
            07 · Next
          </p>
          <h2
            className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.035em] md:text-5xl"
            style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
          >
            The world changed. Your business should too.
          </h2>
          <p
            className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-white/55"
            style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
          >
            Tell us what you're building. Get a scoped plan and a price —
            or take the free call first.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/contact"
              className="rounded-full bg-[#2e9e58] px-10 py-5 text-[13px] font-bold tracking-[0.22em] text-white uppercase transition-all duration-300 hover:bg-white hover:text-[#111111]"
              style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
            >
              Book Free Strategy Call Now →
            </a>
            <a
              href="/quote"
              className="rounded-full border border-white/25 px-8 py-4 text-[11px] font-bold tracking-[0.22em] text-white uppercase transition-all duration-300 hover:border-white hover:bg-white hover:text-[#111111]"
              style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
            >
              Get a Quote
            </a>
          </div>
          <p
            className="mt-5 text-[12px] text-white/50"
            style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
          >
            20 minutes. No pitch. Straight answers on where AI actually pays off for you.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- automation capability catalog — the division's full range, tightened ---------- */
function AutomationCatalog() {
  return (
    <section className="border-b border-black/[0.06] bg-white py-16 md:py-20">
      <div className="mx-auto w-full max-w-6xl px-6">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-xl">
              <p className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase" style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}>
                Everything the division ships
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#111111] md:text-3xl" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}>
                Workflows that run while you sleep — and the software they run on.
              </h3>
              <p className="mt-3 text-[14.5px] leading-relaxed text-[#111111]/60" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}>
                Sales, operations, finance, support — from the first wireframe to the cloud it runs on.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a href="/services" className="inline-flex items-center gap-2 rounded-full bg-[#1e6b3c] px-6 py-3 text-[11px] font-bold tracking-[0.22em] text-white uppercase transition-all hover:bg-[#111111]" style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}>
                Explore Services →
              </a>
              <a href="https://plumbing.demo.elsiaa.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[#111111]/15 px-6 py-3 text-[11px] font-bold tracking-[0.22em] text-[#111111] uppercase transition-all hover:border-[#1e6b3c] hover:text-[#1e6b3c]" style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}>
                See it run live ↗
              </a>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="mt-9 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {AUTOSOFT.map((s, i) => (
              <a
                key={`${s.name}-${i}`}
                href="/services"
                className="group flex flex-col rounded-xl border border-black/[0.07] bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#1e6b3c]/35 hover:shadow-[0_18px_44px_-30px_rgba(17,17,17,0.3)]"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-[13.5px] font-semibold tracking-[-0.01em] text-[#111111]" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}>
                    {s.name}
                  </h4>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-black/10 text-[12px] text-[#111111]/60 transition-all group-hover:border-[#1e6b3c] group-hover:bg-[#1e6b3c] group-hover:text-white">
                    →
                  </span>
                </div>
                <ul className="mt-2.5 space-y-1">
                  {s.items.map((it) => (
                    <li key={it} className="text-[12px] leading-snug text-[#111111]/55" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}>
                      {it}
                    </li>
                  ))}
                </ul>
              </a>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function HomeRows() {
  return (
    <main className="bg-white">
      <ScrollProgress />
      <HomeHero />
      <HeroCards />
      <WhyBrandsChose />
      <SoftwareDemos />
      <AutomationCatalog />
      <DivisionRow
        n="02"
        title="Design"
        lede="Good artists don't use AI — they leverage it. World-class design for every surface of your business."
        graphic={<AssemblingArtist />}
        subs={DESIGN}
        href="/designs"
        cta="Explore Designs"
      />
      <DivisionRow
        n="03"
        title="Consultation"
        lede="Strategy, technology, business, product, growth — book a seat at the table."
        graphic={<LiveGraphic src="/assets/consult_live_v2.mp4" poster="/assets/consult_live_poster_v2.jpg" />}
        subs={CONSULTATION}
        href="/contact"
        cta="Book Consultation"
        extra={
          <>
            <ConsultPricing />
          </>
        }
      />
      <Team />
      <Locations />
      <FinalCTA />
    </main>
  );
}
