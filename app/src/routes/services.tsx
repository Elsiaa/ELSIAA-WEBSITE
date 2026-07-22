import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SiteNav } from "../components/SiteNav";
import { Reveal } from "../components/Reveal";

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
      { property: "og:image", content: "https://elsiaa.higgsfield.app/assets/og_cover.png" },
    ],
    links: [{ rel: "canonical", href: "https://elsiaa.higgsfield.app/services" }],
  }),
  component: Services,
});


const PRODUCTS = [
  {
    num: "01",
    name: "Website Domination",
    price: "Starting at $12k",
    outcome: "Typical 3–5× ROI in 90 days",
    blurb:
      "High-converting websites and landing pages engineered to turn traffic into pipeline.",
  },
  {
    num: "02",
    name: "Operations Overhaul",
    price: "Starting at $18k",
    outcome: "Clients average 40–70% time reduction",
    blurb:
      "Ruthless automation of repetitive work across sales, finance, support, and back office.",
    popular: true,
  },
  {
    num: "03",
    name: "Full AI Transformation",
    price: "Starting at $35k",
    outcome: "For companies ready to lead",
    blurb:
      "End-to-end AI agents, custom software, and secure infrastructure — fully insured.",
  },
  {
    num: "04",
    name: "Retained Partnership",
    price: "Custom monthly retainer",
    outcome: "Priority execution, every month",
    blurb:
      "ELSIAA as your on-demand AI + design team with priority execution every month.",
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
  const PILLARS = [
    {
      key: "Design",
      tagline: "World-class visuals that don't look AI-generated.",
      img: "/assets/pillar_design.jpg",
      items: ["Websites & Landing Pages", "UI/UX & SaaS Interfaces", "Full Branding Systems", "Marketing Assets & Motion", "3D Renders & E-commerce"],
    },
    {
      key: "Automation & Software",
      tagline: "Systems that run while you sleep.",
      img: "/assets/pillar_automation.jpg",
      items: ["Sales & CRM Automation", "Operations & Document AI", "Custom AI Agents & Chatbots", "Internal Tools & Dashboards", "Native Mobile Apps", "Infrastructure & Integrations"],
    },
    {
      key: "Consultation & Strategy",
      tagline: "No-BS advice from people who've done it.",
      img: "/assets/pillar_consult.jpg",
      items: ["AI Roadmapping", "Digital Transformation", "Technical Due Diligence", "Fractional AI Leadership", "Process Audits & Training"],
    },
  ];
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
    "w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-[15px] outline-none focus:border-[#1e6b3c] placeholder:text-[#111111]/50";

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
          <p className="mx-auto mt-5 max-w-xl text-lg text-[#111111]/60" style={inter}>
            We don't sell pilots. We ship production-grade AI systems that
            give you unfair advantages — automation, design, software, and
            strategy your competitors are afraid of.
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
              Pick your weapons.
            </h2>
            <p className="mt-3 max-w-xl text-[15px] text-[#111111]/60" style={inter}>
              Tap up to six — they attach to your inquiry.
            </p>
          </Reveal>

          <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {PILLARS.map((pl, i) => (
              <Reveal key={pl.key} delay={0.05 + i * 0.05}>
                <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-black/[0.07] bg-white transition-all duration-300 hover:border-[#1e6b3c]/35">
                  <div className="h-[150px] overflow-hidden border-b border-black/[0.05] bg-white">
                    <img src={pl.img} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-[19px] font-semibold tracking-[-0.02em]" style={inter}>
                      {pl.key}
                    </h3>
                    <p className="mt-1 text-[13.5px] text-[#111111]/60" style={inter}>
                      {pl.tagline}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {pl.items.map((it) => (
                        <ServiceChip
                          key={it}
                          label={it}
                          active={selected.includes(it)}
                          onToggle={() => toggle(it)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* selection tray */}
          {selected.length > 0 && (
            <div className="sticky bottom-4 z-30 mt-10">
              <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/[0.08] bg-white/95 p-4 shadow-[0_24px_60px_-24px_rgba(17,17,17,0.35)] backdrop-blur">
                <p className="text-[13px] text-[#111111]/70" style={inter}>
                  <span className="font-semibold text-[#111111]">{selected.length}</span>
                  {" "}service{selected.length > 1 ? "s" : ""} selected
                  <span className="text-[#111111]/55"> — {selected.join(", ")}</span>
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
            <p className="mt-3 max-w-xl text-[15px] text-[#111111]/60" style={inter}>
              Your picks ride along. You get a scoped answer, not an autoreply.
            </p>
          </Reveal>

          {done ? (
            <div className="mt-8 rounded-2xl border border-[#1e6b3c]/30 bg-white p-8 text-center">
              <p className="text-2xl">✓</p>
              <p className="mt-2 text-[17px] font-semibold" style={inter}>{done}</p>
              <p className="mt-1 text-[13.5px] text-[#111111]/60" style={inter}>
                Selected: {selected.join(", ")}
              </p>
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-black/[0.07] bg-white p-6 md:p-8">
              <div>
                <p className="text-[11px] tracking-[0.24em] text-[#111111]/55 uppercase" style={mono}>
                  Selected services {selected.length > 0 ? `· ${selected.length}/6` : ""}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selected.length === 0 ? (
                    <p className="text-[13.5px] text-[#111111]/55" style={inter}>
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
              <p className="mt-3 text-center text-[11.5px] text-[#111111]/50" style={inter}>
                Prefer the long form? <a href="/quote" className="text-[#1e6b3c] hover:underline">Build a full quote →</a>
              </p>
            </div>
          )}
        </div>
      </section>

      {/* the packages */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase" style={mono}>
              Service Packages
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.035em] md:text-5xl" style={inter}>
              Four ways in.
            </h2>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {PRODUCTS.map((pd, i) => (
              <Reveal key={pd.num} delay={i * 0.05}>
                <div className={`flex h-full flex-col rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 ${
                  pd.popular
                    ? "border-[#1e6b3c] bg-[#111111] text-white shadow-[0_30px_70px_-30px_rgba(30,107,60,0.55)]"
                    : "border-black/[0.07] bg-white hover:border-[#1e6b3c]/40 hover:shadow-[0_24px_60px_-30px_rgba(17,17,17,0.3)]"
                }`}>
                  <div className="flex items-baseline justify-between">
                    <p className={`text-[10px] tracking-[0.28em] uppercase ${pd.popular ? "text-[#2e9e58]" : "text-[#1e6b3c]"}`} style={mono}>
                      {pd.num}
                    </p>
                    {pd.popular && (
                      <span className="rounded-full bg-[#2e9e58] px-2.5 py-1 text-[10px] font-bold tracking-[0.14em] text-white uppercase" style={mono}>
                        Most popular
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2.5 text-[19px] font-semibold tracking-[-0.02em]" style={inter}>
                    {pd.name}
                  </h3>
                  <p className={`mt-3 text-[13.5px] leading-relaxed ${pd.popular ? "text-white/65" : "text-[#111111]/55"}`} style={inter}>
                    {pd.blurb}
                  </p>
                  <div className="mt-auto pt-5">
                    <p className={`text-[14px] font-semibold ${pd.popular ? "text-white" : "text-[#111111]"}`} style={mono}>
                      {pd.price}
                    </p>
                    <p className={`mt-1 text-[12px] ${pd.popular ? "text-[#2e9e58]" : "text-[#1e6b3c]"}`} style={inter}>
                      {pd.outcome}
                    </p>
                    <button
                      onClick={jumpToForm}
                      className={`mt-4 w-full rounded-full px-4 py-3 text-[10.5px] font-bold tracking-[0.18em] uppercase transition-all ${
                        pd.popular
                          ? "bg-[#2e9e58] text-white hover:bg-white hover:text-[#111111]"
                          : "border border-[#111111]/20 text-[#111111] hover:border-[#1e6b3c] hover:bg-[#1e6b3c] hover:text-white"
                      }`}
                      style={mono}
                    >
                      Start here →
                    </button>
                  </div>
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
            20 minutes. No pitch. Real answers.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] text-white/50" style={inter}>
            Tell us your biggest bottleneck and we'll show you exactly where
            AI wins.
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
