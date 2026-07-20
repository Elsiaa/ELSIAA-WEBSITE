import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { SiteNav } from "../components/SiteNav";

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

function Services() {
  return (
    <main className="bg-white text-[#111111] antialiased">
      <SiteNav />

      {/* hero */}
      <section className="flex min-h-[62svh] flex-col items-center justify-center bg-gradient-to-b from-white to-[#F5F5F3] px-6 pt-28 pb-16 text-center">
        <Reveal>
          <p
            className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            ELSIAA Services
          </p>
          <h1
            className="mx-auto mt-4 max-w-4xl text-5xl font-semibold tracking-[-0.04em] md:text-8xl"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Build. Automate. Dominate.
          </h1>
          <p
            className="mx-auto mt-6 max-w-xl text-lg text-[#111111]/50 md:text-xl"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Practical AI products for businesses. Pick the box that matches the
            problem.
          </p>
        </Reveal>
      </section>

      {/* numbered product boxes */}
      <section className="bg-[#F5F5F3] px-6 pb-24">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 md:grid-cols-2">
          {PRODUCTS.map((p, i) => (
            <Reveal key={p.num} delay={(i % 2) * 0.08}>
              <div className="group flex h-full flex-col rounded-2xl border border-black/[0.06] bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:border-[#1e6b3c]/30 hover:shadow-[0_28px_70px_-32px_rgba(30,107,60,0.35)]">
                <div className="flex items-baseline justify-between">
                  <p
                    className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {p.cat}
                  </p>
                  <span
                    className="text-2xl font-semibold text-black/[0.12] transition-colors duration-300 group-hover:text-[#1e6b3c]/25"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {p.num}
                  </span>
                </div>
                <h2
                  className="mt-3 text-2xl font-semibold tracking-[-0.035em] md:text-3xl"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {p.name}
                </h2>
                <p
                  className="mt-3 text-[15px] leading-relaxed text-[#111111]/55"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {p.blurb}
                </p>
                <ul className="mt-5 space-y-2.5">
                  {p.points.map((pt) => (
                    <li
                      key={pt}
                      className="flex items-start gap-2.5 text-[14px] leading-relaxed text-[#111111]/70"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-[#1e6b3c] text-[9px] font-bold text-white">
                        ✓
                      </span>
                      {pt}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-7">
                  <a
                    href={p.cta.href}
                    className="inline-flex items-center gap-2 rounded-full border border-[#111111]/20 px-6 py-2.5 text-[10px] tracking-[0.26em] text-[#111111] uppercase transition-all duration-300 group-hover:border-[#1e6b3c] group-hover:bg-[#1e6b3c] group-hover:text-white"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {p.cta.label}
                    <span>→</span>
                  </a>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* closing */}
      <section className="bg-[#070907] px-6 py-28 text-center text-[#F5F5F3]">
        <Reveal>
          <p
            className="text-[10px] tracking-[0.42em] text-[#2e9e58] uppercase"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            ELSIAA
          </p>
          <h2
            className="mx-auto mt-6 max-w-3xl text-4xl leading-[1.08] italic md:text-6xl"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Not sure which box? Start with a conversation.
          </h2>
          <a
            href="mailto:isya@elsiaa.com?subject=Where%20do%20we%20start"
            className="group mt-12 inline-flex items-center gap-3 rounded-full border border-[#F5F5F3]/25 px-9 py-3.5 text-[11px] tracking-[0.3em] uppercase transition-colors duration-300 hover:border-[#2e9e58] hover:text-[#2e9e58]"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Talk to ELSIAA
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </a>
          <p
            className="mt-14 text-[10px] tracking-[0.22em] text-[#F5F5F3]/35 uppercase"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Antwerp · Geneva · London · Tel Aviv · New York · Los Angeles
          </p>
          <p
            className="mt-8 text-sm italic text-[#F5F5F3]/40"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Omnia possibilia
          </p>
        </Reveal>
      </section>
    </main>
  );
}
