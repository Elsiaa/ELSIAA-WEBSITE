import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SiteNav } from "../components/SiteNav";
import { DESIGN, AUTOMATION, SOFTWARE, CONSULTATION } from "../components/HomeRows";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — ELSIAA · AI Done Better" },
      {
        name: "description",
        content:
          "Websites, apps, AI automation, and infrastructure — practical AI products for businesses. Pick the box that matches the problem.",
      },
      { property: "og:title", content: "Services — ELSIAA" },
      {
        property: "og:description",
        content: "Pick the box that matches the problem.",
      },
      { property: "og:image", content: "/assets/og_cover.png" },
    ],
  }),
  component: Services,
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
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.opacity = "1";
      el.style.transform = "none";
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            el.style.opacity = "1";
            el.style.transform = "none";
            io.disconnect();
          }
      },
      { threshold: 0.14 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: 0,
        transform: "translateY(32px)",
        transition: `opacity .9s cubic-bezier(.22,.61,.36,1) ${delay}s, transform .9s cubic-bezier(.22,.61,.36,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

const PRODUCTS = [
  {
    num: "01",
    cat: "Web presence",
    name: "Websites",
    blurb:
      "Conversion-focused sites built around one job: turning visitors into inquiries. Every scroll designed with intent — you've seen ours.",
    points: [
      "Marketing sites, landing pages, e-commerce",
      "Interactive scroll experiences that sell",
      "Built to convert, measured to prove it",
    ],
    cta: { label: "Explore designs", href: "/designs" },
  },
  {
    num: "02",
    cat: "Mobile & software",
    name: "Apps & Custom Software",
    blurb:
      "Native-feeling mobile apps and bespoke software your team actually enjoys using — designed, built, and shipped end to end.",
    points: [
      "iOS and Android app design and development",
      "Internal tools and client-facing platforms",
      "UI/UX your developers can build from",
    ],
    cta: { label: "Start a build", href: "mailto:isya@elsiaa.com?subject=App%20%2F%20software%20project" },
  },
  {
    num: "03",
    cat: "Operations",
    name: "AI Automation",
    blurb:
      "Workflows that run themselves. We find the repetitive work inside your business and hand it to systems that never call in sick.",
    points: [
      "Follow-ups, reporting, research, client communication",
      "Built around a real process in your business",
      "Your team trained to manage and extend it",
    ],
    cta: { label: "Automate something", href: "mailto:isya@elsiaa.com?subject=Automation%20inquiry" },
  },
  {
    num: "04",
    cat: "Foundation",
    name: "AI Infrastructure",
    blurb:
      "The layer underneath: model integrations, data pipelines, and the systems that let every future AI project ship faster than the last.",
    points: [
      "LLM integrations built into your stack",
      "Secure, maintainable, documented",
      "Foundation once — leverage forever",
    ],
    cta: { label: "Lay the foundation", href: "mailto:isya@elsiaa.com?subject=AI%20infrastructure" },
  },
  {
    num: "05",
    cat: "Direction",
    name: "AI Consultation",
    blurb:
      "A working session with ELSIAA leadership: we map where AI actually pays off in your business — and where it doesn't.",
    points: [
      "One hour, straight answers",
      "A prioritized roadmap you keep",
      "No pitch — just the map",
    ],
    cta: { label: "Book a session", href: "mailto:isya@elsiaa.com?subject=Consultation%20request" },
  },
  {
    num: "06",
    cat: "Partnership",
    name: "Ongoing Partnership",
    blurb:
      "ELSIAA as your standing design and AI team — leadership, implementation, and every service above, on call.",
    points: [
      "Fractional AI and design leadership",
      "Priority build capacity every month",
      "One partner across web, apps, and automation",
    ],
    cta: { label: "Talk partnership", href: "mailto:isya@elsiaa.com?subject=Partnership%20inquiry" },
  },
];

function ServiceChip({
  label,
  active,
  onToggle,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`rounded-full border px-4 py-2 text-[13px] transition-all duration-200 ${
        active
          ? "border-[#1e6b3c] bg-[#1e6b3c] text-white"
          : "border-black/12 bg-white text-[#111111]/70 hover:border-[#1e6b3c] hover:text-[#1e6b3c]"
      }`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {label}
    </button>
  );
}

function Services() {
  const DIVISIONS = [
    { key: "Design", groups: DESIGN },
    { key: "Automation", groups: AUTOMATION },
    { key: "Software", groups: SOFTWARE },
    { key: "Consultation", groups: CONSULTATION },
  ];
  const [tab, setTab] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);

  const toggle = (label: string) => {
    setSelected((sel) =>
      sel.includes(label)
        ? sel.filter((x) => x !== label)
        : sel.length >= 6
          ? sel
          : [...sel, label],
    );
  };
  const jumpToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const submit = async () => {
    setError(null);
    if (!name.trim() || !email.trim() || selected.length === 0 || !message.trim()) {
      setError("Pick at least one service and fill in your name, email, and a few words about the project.");
      return;
    }
    setSending(true);
    try {
      const r = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          company,
          projectTypes: selected,
          description: message,
          notes: "Submitted from the Services page — service inquiry.",
        }),
      });
      const j = (await r.json()) as { ok?: boolean };
      if (j.ok) setDone("We got it. A scoped answer is on its way to your inbox.");
      else setError("Something didn't go through — try again or email isya@elsiaa.com.");
    } catch {
      setError("Something didn't go through — try again or email isya@elsiaa.com.");
    } finally {
      setSending(false);
    }
  };

  const mono = { fontFamily: "'IBM Plex Mono', monospace" } as const;
  const inter = { fontFamily: "'Inter', sans-serif" } as const;
  const inputCls =
    "w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-[15px] outline-none focus:border-[#1e6b3c] placeholder:text-[#111111]/30";

  return (
    <main className="bg-white text-[#111111] antialiased">
      <SiteNav />

      {/* hero */}
      <section className="flex min-h-[52svh] flex-col items-center justify-center bg-white px-6 pt-28 pb-14 text-center">
        <Reveal>
          <p className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase" style={mono}>
            ELSIAA Services
          </p>
          <h1
            className="mx-auto mt-4 max-w-4xl text-5xl font-semibold tracking-[-0.04em] md:text-7xl"
            style={inter}
          >
            Build. Automate. Dominate.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-[#111111]/50" style={inter}>
            Pick the services you need. Talk to us about them right here.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={jumpToForm}
              className="rounded-full bg-[#1e6b3c] px-7 py-3.5 text-[11px] font-bold tracking-[0.22em] text-white uppercase transition-all hover:bg-[#111111]"
              style={mono}
            >
              Contact us by service ↓
            </button>
            <a
              href="/quote"
              className="rounded-full border border-[#111111]/15 px-7 py-3.5 text-[11px] font-bold tracking-[0.22em] text-[#111111] uppercase transition-all hover:border-[#1e6b3c] hover:text-[#1e6b3c]"
              style={mono}
            >
              Full quote builder →
            </a>
          </div>
        </Reveal>
      </section>

      {/* solutions explorer */}
      <section className="border-t border-black/[0.06] bg-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase" style={mono}>
              The Solutions
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.035em] md:text-5xl" style={inter}>
              See what we offer. Tap what you need.
            </h2>
            <p className="mt-3 max-w-xl text-[15px] text-[#111111]/50" style={inter}>
              Tap up to six services — they attach to your inquiry.
            </p>
          </Reveal>

          {/* division tabs */}
          <Reveal delay={0.08}>
            <div className="mt-9 flex flex-wrap gap-2">
              {DIVISIONS.map((d, i) => (
                <button
                  key={d.key}
                  onClick={() => setTab(i)}
                  className={`rounded-full px-6 py-2.5 text-[11px] font-bold tracking-[0.2em] uppercase transition-all duration-200 ${
                    tab === i
                      ? "bg-[#111111] text-white"
                      : "border border-black/10 bg-white text-[#111111]/60 hover:border-[#111111]/40 hover:text-[#111111]"
                  }`}
                  style={mono}
                >
                  {d.key}
                </button>
              ))}
            </div>
          </Reveal>

          {/* groups + chips */}
          <div className="mt-8 grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {DIVISIONS[tab].groups.map((g) => (
              <div key={`${DIVISIONS[tab].key}-${g.name}`}>
                <p className="text-[10px] tracking-[0.26em] text-[#1e6b3c] uppercase" style={mono}>
                  {g.name}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {g.items.map((it) => (
                    <ServiceChip
                      key={it}
                      label={it}
                      active={selected.includes(it)}
                      onToggle={() => toggle(it)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* selection tray */}
          {selected.length > 0 && (
            <div className="sticky bottom-4 z-30 mt-10">
              <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/[0.08] bg-white/95 p-4 shadow-[0_24px_60px_-24px_rgba(17,17,17,0.35)] backdrop-blur">
                <p className="text-[13px] text-[#111111]/70" style={inter}>
                  <span className="font-semibold text-[#111111]">{selected.length}</span>
                  {" "}service{selected.length > 1 ? "s" : ""} selected
                  <span className="text-[#111111]/40"> — {selected.join(", ")}</span>
                </p>
                <button
                  onClick={jumpToForm}
                  className="rounded-full bg-[#1e6b3c] px-6 py-3 text-[10.5px] font-bold tracking-[0.2em] text-white uppercase transition-all hover:bg-[#111111]"
                  style={mono}
                >
                  Contact us about these →
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* inquiry by service */}
      <section ref={formRef} className="border-t border-black/[0.06] bg-[#F7F7F5] px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <p className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase" style={mono}>
              Contact by Service
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] md:text-4xl" style={inter}>
              Tell us where to point the machine.
            </h2>
            <p className="mt-3 max-w-xl text-[15px] text-[#111111]/50" style={inter}>
              Your picks ride along. You get a scoped answer, not an autoreply.
            </p>
          </Reveal>

          {done ? (
            <div className="mt-8 rounded-2xl border border-[#1e6b3c]/30 bg-white p-8 text-center">
              <p className="text-2xl">✓</p>
              <p className="mt-2 text-[17px] font-semibold" style={inter}>{done}</p>
              <p className="mt-1 text-[13.5px] text-[#111111]/50" style={inter}>
                Selected: {selected.join(", ")}
              </p>
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-black/[0.07] bg-white p-6 md:p-8">
              <div>
                <p className="text-[11px] tracking-[0.24em] text-[#111111]/45 uppercase" style={mono}>
                  Selected services {selected.length > 0 ? `· ${selected.length}/6` : ""}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selected.length === 0 ? (
                    <p className="text-[13.5px] text-[#111111]/40" style={inter}>
                      Nothing selected yet — tap services in the explorer above.
                    </p>
                  ) : (
                    selected.map((sel) => (
                      <span
                        key={sel}
                        className="flex items-center gap-2 rounded-full bg-[#1e6b3c]/10 px-4 py-2 text-[13px] text-[#1e6b3c]"
                        style={inter}
                      >
                        {sel}
                        <button onClick={() => toggle(sel)} className="text-[#1e6b3c]/60 hover:text-[#1e6b3c]">✕</button>
                      </span>
                    ))
                  )}
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name *" className={inputCls} style={inter} />
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email *" type="email" className={inputCls} style={inter} />
              </div>
              <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company (optional)" className={`${inputCls} mt-3`} style={inter} />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What should these services do for your business? *"
                rows={4}
                className={`${inputCls} mt-3 resize-none`}
                style={inter}
              />
              {error && (
                <p className="mt-3 text-[13px] text-red-600" style={inter}>{error}</p>
              )}
              <button
                onClick={submit}
                disabled={sending}
                className="mt-5 w-full rounded-full bg-[#1e6b3c] px-6 py-4 text-[11px] font-bold tracking-[0.22em] text-white uppercase transition-all hover:bg-[#111111] disabled:opacity-50"
                style={mono}
              >
                {sending ? "Sending…" : "Send the inquiry →"}
              </button>
              <p className="mt-3 text-center text-[11.5px] text-[#111111]/35" style={inter}>
                Prefer the long form? <a href="/quote" className="text-[#1e6b3c] hover:underline">Build a full quote →</a>
              </p>
            </div>
          )}
        </div>
      </section>

      {/* the six boxes */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase" style={mono}>
              The Packages
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.035em] md:text-5xl" style={inter}>
              Or pick the box that matches the problem.
            </h2>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PRODUCTS.map((pd, i) => (
              <Reveal key={pd.num} delay={i * 0.04}>
                <div className="flex h-full flex-col rounded-2xl border border-black/[0.07] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#1e6b3c]/40 hover:shadow-[0_24px_60px_-30px_rgba(17,17,17,0.3)]">
                  <div className="flex items-baseline justify-between">
                    <p className="text-[10px] tracking-[0.28em] text-[#1e6b3c] uppercase" style={mono}>
                      {pd.num} · {pd.cat}
                    </p>
                  </div>
                  <h3 className="mt-2.5 text-[19px] font-semibold tracking-[-0.02em]" style={inter}>
                    {pd.name}
                  </h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-[#111111]/55" style={inter}>
                    {pd.blurb}
                  </p>
                  <ul className="mt-3.5 flex-1 space-y-1.5">
                    {pd.points.map((pt) => (
                      <li key={pt} className="flex gap-2 text-[13px] text-[#111111]/65" style={inter}>
                        <span className="text-[#1e6b3c]">—</span>
                        {pt}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={pd.cta.href}
                    className="mt-4 inline-block text-[11px] tracking-[0.22em] text-[#1e6b3c] uppercase hover:underline"
                    style={mono}
                  >
                    {pd.cta.label} →
                  </a>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* closing */}
      <section className="bg-[#070907] px-6 py-24 text-center text-[#F5F5F3]">
        <Reveal>
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-[-0.035em] md:text-5xl" style={inter}>
            Not sure which box? That's the free call.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] text-white/50" style={inter}>
            20 minutes with ELSIAA leadership — a straight answer on where AI
            pays off for you.
          </p>
          <a
            href="/contact"
            className="mt-8 inline-block rounded-full bg-[#2e9e58] px-8 py-4 text-[11px] font-bold tracking-[0.22em] text-white uppercase transition-all hover:bg-white hover:text-[#111111]"
            style={mono}
          >
            Book the free call →
          </a>
        </Reveal>
      </section>
    </main>
  );
}
