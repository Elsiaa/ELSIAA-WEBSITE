import { useEffect, useRef, useState } from "react";
import { AssemblingArtist } from "./AssemblingArtist";
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
  drift = 0.5,
}: {
  children: React.ReactNode;
  drift?: number;
}) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const paused = useRef(false);
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let pos = rail.scrollLeft;
    rail.addEventListener("scroll", () => {
      if (Math.abs(rail.scrollLeft - pos) > 2) pos = rail.scrollLeft;
    });
    const tick = () => {
      if (!paused.current) {
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
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-[1fr_400px] md:gap-14">
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
            <a href={href} className="group block overflow-hidden rounded-2xl bg-white">
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
                className="group flex w-[236px] flex-none flex-col rounded-xl border border-black/[0.07] bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#1e6b3c]/35 hover:shadow-[0_18px_44px_-30px_rgba(17,17,17,0.3)]"
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


/* ---------- booking: free 20-min intro, $100 30-min consultation ---------- */
function slotsForNextDays(count: number) {
  const out: { label: string; iso: string }[] = [];
  const d = new Date();
  while (out.length < count) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day === 0 || day === 6) continue;
    out.push({
      label: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      iso: d.toISOString().slice(0, 10),
    });
  }
  return out;
}
const HOURS = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

function Booking() {
  const [kind, setKind] = useState<"free" | "paid">("free");
  const [day, setDay] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const days = useRef(slotsForNextDays(10)).current;

  const valid = day && time && name.trim() && /.+@.+\..+/.test(email);

  const book = async () => {
    if (!valid || state === "sending") return;
    setState("sending");
    try {
      const fd = new FormData();
      fd.append("_subject", `ELSIAA Booking — ${kind === "free" ? "Free 20-min intro" : "$100 30-min consultation"} — ${name}`);
      fd.append("Call type", kind === "free" ? "Free intro call (20 min)" : "Paid consultation (30 min, $100)");
      fd.append("Date", day);
      fd.append("Time", `${time} (client local)`);
      fd.append("Name", name);
      fd.append("Email", email);
      fd.append("_template", "table");
      fd.append("_captcha", "false");
      const res = await fetch("https://formsubmit.co/ajax/isya@elsiaa.com", {
        method: "POST",
        body: fd,
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(String(res.status));
      setState("done");
    } catch {
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <div className="mt-10 rounded-2xl border border-[#1e6b3c]/30 bg-[#1e6b3c]/[0.05] p-8 text-center">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#1e6b3c] text-white">✓</span>
        <h3 className="mt-4 text-lg font-semibold" style={{ fontFamily: "'Inter', sans-serif" }}>
          Call requested
        </h3>
        <p className="mt-1.5 text-[13.5px] text-[#111111]/55">
          {kind === "free" ? "Your free 20-minute intro" : "Your 30-minute consultation"} — {day} at {time}. Confirmation
          lands at <span className="font-medium text-[#111111]">{email}</span> within hours
          {kind === "paid" ? ", with a secure payment link for the $100 session." : "."}
        </p>
      </div>
    );
  }

  return (
    <div id="book" className="mt-10 scroll-mt-28 rounded-2xl border border-black/[0.07] bg-white p-6 md:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="text-lg font-semibold tracking-[-0.02em] md:text-xl" style={{ fontFamily: "'Inter', sans-serif" }}>
          Book your call
        </h3>
        <span className="text-[10px] tracking-[0.22em] text-[#111111]/40 uppercase" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          First call free
        </span>
      </div>

      {/* call type */}
      <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {(
          [
            { id: "free", title: "Intro call", meta: "20 minutes · Free", pitch: "Meet us, map the opportunity, leave with next steps." },
            { id: "paid", title: "Consultation", meta: "30 minutes · $100", pitch: "Working session — strategy, architecture, and a concrete plan." },
          ] as const
        ).map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setKind(o.id)}
            className={`rounded-xl border p-4 text-left transition-all duration-200 ${
              kind === o.id ? "border-[#1e6b3c] bg-[#1e6b3c]/[0.05] shadow-[0_14px_34px_-26px_rgba(30,107,60,0.7)]" : "border-black/10 hover:border-black/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-semibold" style={{ fontFamily: "'Inter', sans-serif" }}>{o.title}</span>
              <span className={`text-[11px] font-semibold ${kind === o.id ? "text-[#1e6b3c]" : "text-[#111111]/45"}`} style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                {o.meta}
              </span>
            </div>
            <p className="mt-1 text-[12px] leading-snug text-[#111111]/50">{o.pitch}</p>
          </button>
        ))}
      </div>

      {/* schedule */}
      <div className="mt-5">
        <span className="text-[10px] tracking-[0.22em] text-[#111111]/45 uppercase" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Pick a day</span>
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {days.map((d) => (
            <button
              key={d.iso}
              type="button"
              onClick={() => setDay(d.label)}
              className={`flex-none rounded-lg border px-3.5 py-2.5 text-[12px] font-medium transition-all ${
                day === d.label ? "border-[#1e6b3c] bg-[#1e6b3c] text-white" : "border-black/10 bg-white text-[#111111]/65 hover:border-black/30"
              }`}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {d.label}
            </button>
          ))}
        </div>
        <span className="mt-4 block text-[10px] tracking-[0.22em] text-[#111111]/45 uppercase" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Pick a time</span>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {HOURS.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setTime(h)}
              className={`rounded-lg border px-3.5 py-2 text-[12px] font-medium transition-all ${
                time === h ? "border-[#1e6b3c] bg-[#1e6b3c] text-white" : "border-black/10 bg-white text-[#111111]/65 hover:border-black/30"
              }`}
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      {/* contact */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          className="rounded-xl border border-black/10 bg-white px-4 py-3 text-[14px] outline-none transition-colors focus:border-[#1e6b3c]"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Email"
          className="rounded-xl border border-black/10 bg-white px-4 py-3 text-[14px] outline-none transition-colors focus:border-[#1e6b3c]"
        />
      </div>

      <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <button
          onClick={book}
          disabled={!valid || state === "sending"}
          className={`rounded-full px-7 py-3.5 text-[11px] font-bold tracking-[0.2em] uppercase transition-all ${
            valid ? "bg-[#111111] text-white hover:bg-[#1e6b3c]" : "cursor-not-allowed bg-black/[0.06] text-[#111111]/35"
          }`}
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          {state === "sending" ? "Booking…" : kind === "free" ? "Book free call →" : "Book — $100 →"}
        </button>
        <p className="text-[11.5px] text-[#111111]/40" style={{ fontFamily: "'Inter', sans-serif" }}>
          {kind === "paid"
            ? "Secure card checkout with Stripe is coming online — for now you'll receive a payment link with your confirmation."
            : "Confirmation arrives by email within hours."}
        </p>
      </div>
      {state === "error" && (
        <p className="mt-3 text-[13px] text-[#E53E3E]">
          Something broke — try again or email <a className="underline" href="mailto:isya@elsiaa.com">isya@elsiaa.com</a>.
        </p>
      )}
    </div>
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
    <section className="border-t border-black/[0.06] bg-white py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <p className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            05 · Intelligence
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
    <div className="mt-8">
      <Rail drift={0}>
        {TIERS.map((t) => (
          <div
            key={t.name}
            className={`flex w-[248px] flex-none flex-col rounded-xl border p-5 transition-all duration-300 hover:-translate-y-1 ${
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
              href={`mailto:isya@elsiaa.com?subject=${encodeURIComponent(`Consultation — ${t.name}`)}&body=${encodeURIComponent(`Hi ELSIAA,\n\nI'd like to book the ${t.name} consultation (${t.price} / ${t.unit}).\n\nMy business:\nBest times:`)}`}
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
      </Rail>
      <p className="mt-2 px-2 text-[11px] text-black/35" style={{ fontFamily: "'Inter', sans-serif" }}>
        Checkout by card is coming online with Stripe — booking currently confirms by email within hours.
      </p>
    </div>
  );
}

/* ---------- locations ---------- */
const CITIES = [
  { name: "New York City", q: "Manhattan, New York", flag: "\u{1F1FA}\u{1F1F8}", vid: "/assets/city_nyc.mp4" },
  { name: "London", q: "London, UK", flag: "\u{1F1EC}\u{1F1E7}", vid: "/assets/city_london.mp4" },
  { name: "Geneva", q: "Geneva, Switzerland", flag: "\u{1F1E8}\u{1F1ED}", vid: "/assets/city_geneva.mp4" },
  { name: "Antwerp", q: "Antwerp, Belgium", flag: "\u{1F1E7}\u{1F1EA}", vid: "/assets/city_antwerp.mp4" },
  { name: "Tel Aviv", q: "Tel Aviv, Israel", flag: "\u{1F1EE}\u{1F1F1}", vid: "/assets/city_telaviv.mp4" },
  { name: "Los Angeles", q: "Los Angeles, California", flag: "\u{1F1FA}\u{1F1F8}", vid: "/assets/city_la.mp4" },
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
      {/* international colours riding on the footage */}
      <div className="absolute top-6 right-6 flex gap-2.5 text-[17px] md:top-8 md:right-10">
        {CITIES.filter((c, i, a) => a.findIndex((x) => x.flag === c.flag) === i).map(
          (c) => (
            <span key={c.flag} className="opacity-80 drop-shadow">
              {c.flag}
            </span>
          )
        )}
      </div>
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
                    <span className="text-[13px]">{c.flag}</span>
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
            07 · Team
          </p>
          <h2
            className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-[#111111] md:text-4xl"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            The people behind the lion.
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

/* ---------- masthead: two seconds of identity, then the rows ---------- */
function Masthead() {
  return (
    <header className="mx-auto flex min-h-[86vh] max-w-6xl flex-col justify-center px-6 pt-28 pb-10 md:min-h-[88vh] md:pt-24">
      <Reveal>
        <p
          className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          ELSIAA · AI Done Better
        </p>
        <h1
          className="mt-4 max-w-3xl text-[10.5vw] leading-[0.98] font-semibold tracking-[-0.04em] text-[#111111] sm:text-5xl md:text-6xl"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Four divisions.
          <br />
          <span className="text-[#1e6b3c]">One empire of detail.</span>
        </h1>
        <p
          className="mt-5 max-w-lg text-[15px] leading-relaxed text-[#111111]/55"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Design, automation, software, and counsel — engineered for businesses
          that intend to be taken seriously.
        </p>
      </Reveal>
    </header>
  );
}

export function HomeRows() {
  return (
    <main className="bg-white">
      <Masthead />
      <DivisionRow
        n="01"
        title="Design"
        lede="Everything your customers see, engineered to be believed."
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
        img="/assets/home_software.jpg"
        subs={SOFTWARE}
        href="/services"
      />
      <DivisionRow
        n="04"
        title="Consultation"
        lede="Strategy, technology, business, product, growth — book a seat at the table."
        img="/assets/home_advisor.jpg"
        subs={CONSULTATION}
        href="/services"
        extra={
          <>
            <ConsultPricing />
            <Booking />
          </>
        }
      />
      <StatsSection />
      <Locations />
      <Team />
    </main>
  );
}
