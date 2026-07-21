import { useEffect, useRef, useState } from "react";
import { AssemblingArtist } from "./AssemblingArtist";
import { LiveGraphic } from "./LiveGraphic";
import { WorkingRobot } from "./WorkingRobot";

/* ============================================================
   ELSIAA homepage — built from Isya's notebook sketch 06/20/26
   Mobile-first: graphic block + title + subcategory card
   carousel per division, consultation pricing, locations, team.
   ============================================================ */

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && (setOn(true), io.disconnect()),
      { threshold: 0.15 },
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
        transform: on ? "none" : "translateY(26px)",
        transition: `opacity .8s ease ${delay}s, transform .8s cubic-bezier(.2,.8,.2,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
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
    <div className="relative">
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
            "linear-gradient(to right, transparent 0, black 44px, black calc(100% - 44px), transparent 100%)",
          maskImage:
            "linear-gradient(to right, transparent 0, black 44px, black calc(100% - 44px), transparent 100%)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ---------- one division row: graphic + title + subcategory cards ---------- */
type Sub = { name: string; items: string[] };

function DivisionRow({
  n,
  title,
  lede,
  img,
  graphic,
  subs,
  href,
  extra,
}: {
  n: string;
  title: string;
  lede: string;
  img?: string;
  graphic?: React.ReactNode;
  subs: Sub[];
  href: string;
  flip?: boolean;
  extra?: React.ReactNode;
}) {
  return (
    <section className="border-t border-black/[0.06] bg-white py-16 md:py-24">
      <div className="mx-auto w-full max-w-6xl px-6">
        {/* header + graphic — one clean composed row */}
        <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[minmax(0,1fr)_560px] md:gap-8">
          <Reveal>
            <p
              className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {n} · Division
            </p>
            <h2
              className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-[#111111] md:text-5xl"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {title}
            </h2>
            <p
              className="mt-3 max-w-md text-[15px] text-[#111111]/50"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {lede}
            </p>
            <a
              href={href}
              className="mt-5 inline-block text-[11px] tracking-[0.24em] text-[#1e6b3c] uppercase hover:underline"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Explore ↗
            </a>
          </Reveal>
          <Reveal>
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
          </Reveal>
        </div>
        {/* the carousel — one long row across the entire width */}
        <div className="mt-10">
          <Rail>
            {[...subs, ...subs].map((s, i) => (
              <a
                key={`${s.name}-${i}`}
                href={href}
                className="group flex w-[208px] flex-none flex-col rounded-xl border border-black/[0.07] bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#1e6b3c]/35 hover:shadow-[0_18px_44px_-30px_rgba(17,17,17,0.3)]"
              >
                <div className="flex items-center justify-between">
                  <h3
                    className="text-[13.5px] font-semibold tracking-[-0.01em] text-[#111111]"
                    style={{ fontFamily: "'Inter', sans-serif" }}
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
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      {it}
                    </li>
                  ))}
                </ul>
              </a>
            ))}
          </Rail>
        </div>
        {extra}
      </div>
    </section>
  );
}


/* ---------- AI industry statistics ---------- */
const STATS = [
  { pct: 78, industry: "All industries", line: "of organizations now use AI in at least one business function." },
  { pct: 66, industry: "Healthcare", line: "of physicians report using health AI tools in their practice." },
  { pct: 91, industry: "Finance", line: "of financial firms are deploying or assessing AI today." },
  { pct: 71, industry: "Marketing", line: "of marketing teams use generative AI at least weekly." },
  { pct: 63, industry: "Retail", line: "of retailers attribute measurable revenue lift to AI." },
  { pct: 55, industry: "Manufacturing", line: "of manufacturers apply AI across production and operations." },
];

function CountUp({ target }: { target: number }) {
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
        const dur = 1400;
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
      {val}%
    </span>
  );
}

function StatsSection() {
  return (
    <section className="bg-white pt-32 pb-14 md:pt-36 md:pb-16">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <p className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            Intelligence
          </p>
          <div className="mt-2 flex items-baseline justify-between gap-4">
            <h2 className="text-3xl font-semibold tracking-[-0.035em] text-[#111111] md:text-5xl" style={{ fontFamily: "'Inter', sans-serif" }}>
              AI is not coming. It's here.
            </h2>
            <a
              href="/insights"
              className="hidden flex-none text-[11px] tracking-[0.24em] text-[#1e6b3c] uppercase hover:underline md:block"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Read the research ↗
            </a>
          </div>
          <p className="mt-3 max-w-md text-[15px] text-[#111111]/50">
            What adoption actually looks like, industry by industry.
          </p>
        </Reveal>
        <div className="mt-10">
          <Rail drift={0.4}>
            {[...STATS, ...STATS].map((s, i) => (
              <a
                key={`${s.industry}-${i}`}
                href="/insights"
                className="group flex w-[250px] flex-none flex-col rounded-xl border border-black/[0.07] bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#1e6b3c]/35"
              >
                <span className="text-[10px] tracking-[0.24em] text-[#1e6b3c] uppercase" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  {s.industry}
                </span>
                <span className="mt-2 text-5xl font-semibold tracking-[-0.04em] text-[#111111]" style={{ fontFamily: "'Inter', sans-serif" }}>
                  <CountUp target={s.pct} />
                </span>
                <p className="mt-2.5 text-[12.5px] leading-relaxed text-[#111111]/55" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {s.line}
                </p>
              </a>
            ))}
          </Rail>
          <a
            href="/insights"
            className="mt-4 inline-block px-2 text-[11px] tracking-[0.24em] text-[#1e6b3c] uppercase hover:underline md:hidden"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Read the research ↗
          </a>
        </div>
      </div>
    </section>
  );
}

/* ---------- data: the full catalog ---------- */
const DESIGN: Sub[] = [
  { name: "Web", items: ["Website Design", "UI/UX Design", "Landing Pages", "SaaS Interfaces", "E-commerce Design", "Dashboard Design"] },
  { name: "Apps", items: ["Mobile App Design", "iOS & Android UI", "App Store Assets"] },
  { name: "Branding", items: ["Branding & Logo Design", "Brand Identity", "Packaging Design", "Print Design"] },
  { name: "Marketing", items: ["Marketing Graphics", "Social Media Graphics", "Motion Graphics", "Presentation Design"] },
  { name: "Product", items: ["3D Product Renders", "Product Staging", "Commercial Imagery"] },
];
const AUTOMATION: Sub[] = [
  { name: "Sales", items: ["CRM Automation", "Lead Qualification", "Proposal Generation", "Appointment Booking"] },
  { name: "Operations", items: ["Internal Business Automation", "Document Processing", "Data Entry Automation", "Web Scraping", "API Integrations", "Zapier / Make Automation"] },
  { name: "Customer Support", items: ["Customer Follow-up", "Email Automation", "Slack & Discord Bots"] },
  { name: "Finance", items: ["Invoice Automation", "Reporting Dashboards"] },
  { name: "AI", items: ["AI Workflow Automation", "AI Agents & Assistants"] },
];
const SOFTWARE: Sub[] = [
  { name: "Web", items: ["Custom Web Applications", "SaaS Development", "Client Portals"] },
  { name: "Mobile", items: ["iOS Apps", "Android Apps"] },
  { name: "Enterprise", items: ["Internal Company Software", "Employee Dashboards", "Inventory Systems", "CRM Development", "ERP Systems"] },
  { name: "AI", items: ["AI Applications", "AI Chatbots"] },
  { name: "Infrastructure", items: ["API Development", "Database Architecture", "Cloud Infrastructure", "Maintenance & Support"] },
];
const CONSULTATION: Sub[] = [
  { name: "Strategy", items: ["1-on-1 Strategy Calls", "AI Implementation Consulting", "Digital Transformation"] },
  { name: "Technology", items: ["Software Architecture Review", "Technical Due Diligence", "CTO Advisory", "Code Reviews"] },
  { name: "Business", items: ["Business Process Audits", "Automation Planning", "Team Training", "Ongoing Monthly Advisory"] },
  { name: "Product", items: ["Product Roadmapping", "Startup MVP Planning", "UX Audits"] },
  { name: "Growth", items: ["Marketing Strategy", "Funnel & Conversion Advisory"] },
];

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
        className="text-[11px] tracking-[0.28em] text-[#111111]/40 uppercase"
        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
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
              <h3 className="text-[14px] font-semibold" style={{ fontFamily: "'Inter', sans-serif" }}>
                {t.name}
              </h3>
              {t.featured && (
                <span
                  className="rounded-full bg-[#2e9e58] px-2.5 py-1 text-[8px] font-bold tracking-[0.18em] text-white uppercase"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  Most chosen
                </span>
              )}
            </div>
            <p className="mt-3">
              <span className="text-2xl font-semibold tracking-[-0.03em]" style={{ fontFamily: "'Inter', sans-serif" }}>
                {t.price}
              </span>
              <span className={`ml-2 text-[12px] ${t.featured ? "text-white/50" : "text-black/40"}`}>/ {t.unit}</span>
            </p>
            <p
              className={`mt-2.5 text-[12.5px] leading-relaxed ${t.featured ? "text-white/65" : "text-black/55"}`}
              style={{ fontFamily: "'Inter', sans-serif" }}
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
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Book {t.name} →
            </a>
          </div>
        ))}
      </div>
      <p className="mt-2.5 text-[11px] text-black/35" style={{ fontFamily: "'Inter', sans-serif" }}>
        Book directly on the consultation page — first call free, confirmation by email within hours.
      </p>
    </div>
  );
}

/* ---------- locations ---------- */
const CITIES = [
  { name: "New York City", q: "Manhattan, New York", flag: "us", vid: "/assets/city_nyc.mp4" },
  { name: "London", q: "London, UK", flag: "gb", vid: "/assets/city_london.mp4" },
  { name: "Geneva", q: "Geneva, Switzerland", flag: "ch", vid: "/assets/city_geneva.mp4" },
  { name: "Antwerp", q: "Antwerp, Belgium", flag: "be", vid: "/assets/city_antwerp.mp4" },
  { name: "Tel Aviv", q: "Tel Aviv, Israel", flag: "il", vid: "/assets/city_telaviv.mp4" },
  { name: "Los Angeles", q: "Los Angeles, California", flag: "us", vid: "/assets/city_la.mp4" },
];

/* rotating scenic footage of each city, clean loop, flags riding on top */
function CityBackdrop() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % CITIES.length), 9000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="absolute inset-0">
      {CITIES.map((c, i) => (
        <video
          key={c.name}
          src={c.vid}
          autoPlay
          loop
          muted
          playsInline
          preload={i === 0 ? "auto" : "metadata"}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1600ms] ${
            i === idx ? "opacity-40" : "opacity-0"
          }`}
        />
      ))}
    </div>
  );
}

function Locations() {
  return (
    <section className="relative overflow-hidden bg-[#0c0c0c] py-16 text-white md:py-24">
      <CityBackdrop />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0c0c0c]/70 via-transparent to-[#0c0c0c]" />
      <div className="relative mx-auto max-w-5xl px-6">
        <Reveal>
          <p
            className="text-[10px] tracking-[0.32em] text-[#2e9e58] uppercase"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            06 · Locations
          </p>
          <div className="mt-4 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#2e9e58]/50 bg-[#2e9e58]/10">
              {/* headset — support */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2e9e58" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 13v-2a8 8 0 0 1 16 0v2" />
                <path d="M4 13a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h1v-6Z" />
                <path d="M20 13a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1v-6Z" />
                <path d="M19 19a4 4 0 0 1-4 4h-2" />
              </svg>
            </span>
            <p className="text-[13px] leading-snug text-white/80" style={{ fontFamily: "'Inter', sans-serif" }}>
              <span className="font-semibold text-white">24/7 virtual support</span>
              <span className="text-white/50"> — and in person, on site at all times, in the following locations.</span>
            </p>
          </div>
          <h2
            className="mt-3 text-2xl font-semibold tracking-[-0.035em] md:text-4xl"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            One standard. Every timezone.
          </h2>
        </Reveal>
        <div className="mt-10">
          <Rail drift={0.35}>
            {[...CITIES, ...CITIES].map((c, i) => (
              <div
                key={`${c.name}-${i}`}
                className="w-[236px] flex-none overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur"
              >
                <div className="pointer-events-none h-[150px] w-full overflow-hidden">
                  <iframe
                    title={`Map — ${c.name}`}
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(c.q)}&z=11&output=embed`}
                    loading="lazy"
                    className="h-full w-full opacity-90 grayscale-[0.3]"
                    style={{ border: 0 }}
                  />
                </div>
                <div className="flex items-center justify-between p-4">
                  <h3 className="flex items-center gap-2 text-[15px] font-semibold" style={{ fontFamily: "'Inter', sans-serif" }}>
                    <img
                      src={`/assets/flags/${c.flag}.png`}
                      srcSet={`/assets/flags/${c.flag}@2x.png 2x`}
                      alt=""
                      className="h-[13px] w-[19px] rounded-[2px] object-cover ring-1 ring-white/20"
                    />
                    {c.name}
                  </h3>
                  <span
                    className="text-[9px] tracking-[0.22em] text-[#2e9e58] uppercase"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    ELSIAA
                  </span>
                </div>
              </div>
            ))}
          </Rail>
        </div>
      </div>
    </section>
  );
}

/* ---------- team ---------- */
const TEAM = [
  { name: "Yisrael Krug", role: "Founder & Chief Executive Officer", init: "YK" },
  { name: "David Heimowitz", role: "Co-Founder & Chief Technology Officer", init: "DH" },
  { name: "Jacob Rubelow", role: "Executive Legal & Strategic Counsel", init: "JR" },
  { name: "Chaim Lieberman", role: "Director of European Business", init: "CL" },
  { name: "Izzy Eisenberg", role: "Director of California Business", init: "IE" },
  { name: "Berel Krug", role: "Executive Advisor · Healthcare Consultant", init: "BK" },
  { name: "Dr. Esther Krug, MD", role: "Professor of Medicine, Johns Hopkins University", init: "EK" },
  { name: "Dr. Edward Margolin, MD", role: "Professor of Medicine, University of Toronto", init: "EM" },
];

function Team() {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-6">
        <Reveal>
          <p
            className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            07 · Who we are
          </p>
          <h2
            className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-[#111111] md:text-4xl"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Meet the pride.
          </h2>
        </Reveal>
        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TEAM.slice(0, 6).map((m, i) => (
            <Reveal key={m.name} delay={i * 0.05}>
              <div className="group flex items-center gap-3.5 rounded-xl border border-black/[0.07] bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#1e6b3c]/35">
                <span
                  className="flex h-13 w-13 flex-none items-center justify-center rounded-full bg-[#111111] text-[13px] font-bold tracking-wide text-[#2e9e58]"
                  style={{ fontFamily: "'IBM Plex Mono', monospace", width: 52, height: 52 }}
                >
                  {m.init}
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold text-[#111111]" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {m.name}
                  </h3>
                  <p className="mt-0.5 text-[12px] text-[#111111]/50" style={{ fontFamily: "'Inter', sans-serif" }}>
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
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Meet the leadership →
          </a>
        </Reveal>
      </div>
    </section>
  );
}

export function HomeRows() {
  return (
    <main className="bg-white">
      <StatsSection />
      <DivisionRow
        n="01"
        title="Design"
        lede="At ELSIAA we understand design. Good artists don't use AI — they leverage it. We use AI to push the limits of what's possible, delivering the best designs for every aspect of your business."
        graphic={<AssemblingArtist />}
        subs={DESIGN}
        href="/designs"
      />
      <DivisionRow
        n="02"
        title="Automation"
        lede="Workflows that run while you sleep — sales, operations, finance."
        graphic={<WorkingRobot />}
        subs={AUTOMATION}
        href="/services"
        flip
      />
      <DivisionRow
        n="03"
        title="Software"
        lede="Custom applications from first wireframe to cloud infrastructure."
        graphic={<LiveGraphic src="/assets/software_work_v1.mp4" poster="/assets/software_work_poster_v1.jpg" />}
        subs={SOFTWARE}
        href="/services"
      />
      <DivisionRow
        n="04"
        title="Consultation"
        lede="Strategy, technology, business, product, growth — book a seat at the table."
        graphic={<LiveGraphic src="/assets/consult_live_v1.mp4" poster="/assets/consult_live_poster_v1.jpg" />}
        subs={CONSULTATION}
        href="/services"
        extra={
          <>
            <ConsultPricing />
          </>
        }
      />
      <Locations />
      <Team />
    </main>
  );
}
