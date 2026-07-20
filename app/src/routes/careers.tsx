import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { SiteNav } from "../components/SiteNav";

export const Route = createFileRoute("/careers")({
  head: () => ({
    meta: [
      { title: "Careers — ELSIAA · AI Done Better" },
      {
        name: "description",
        content:
          "Build the empire with us. ELSIAA hires builders — engineers, designers, and growth partners who treat every detail like it matters. Because it does.",
      },
      { property: "og:title", content: "Careers — ELSIAA" },
      { property: "og:description", content: "Build the empire with us." },
      { property: "og:image", content: "/assets/og_cover.png" },
    ],
  }),
  component: Careers,
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

const VALUES = [
  {
    title: "Every detail, like Rome.",
    body: "We build like an empire — corporate scale, artisan care. If a pixel, a sentence, or a handoff isn't right, it isn't done.",
  },
  {
    title: "Build first.",
    body: "We don't produce plans about work. We produce work. Ideas earn respect here by shipping.",
  },
  {
    title: "Growth is the deal.",
    body: "We invest in training, mentorship, and real responsibility early. Perform, and the role grows with you — that's written into how we hire.",
  },
  {
    title: "Everywhere at once.",
    body: "Antwerp, Geneva, London, Tel Aviv, New York, Los Angeles. Remote-first, standard-uniform: excellent from anywhere.",
  },
];

const ROLES = [
  {
    num: "01",
    cat: "Engineering",
    name: "AI Engineer",
    type: "Remote · Project & full-time tracks",
    blurb:
      "Build the systems our clients pay for — automations, integrations, and custom software with AI at the core. You ship fast and you ship clean.",
    points: [
      "LLM integrations, agents, and data pipelines",
      "Full-stack comfort (we use React, TypeScript, and whatever wins)",
      "You've built things that real people use",
    ],
  },
  {
    num: "02",
    cat: "Design",
    name: "Product Designer",
    type: "Remote · Portfolio-first",
    blurb:
      "You've seen our designs page — that's the bar. Websites, apps, and brand systems that make cautious business owners feel something.",
    points: [
      "Web and mobile design with taste and restraint",
      "Motion literacy — you think in transitions",
      "A portfolio that argues for itself",
    ],
  },
  {
    num: "03",
    cat: "Growth",
    name: "Growth & Marketing Partner",
    type: "Remote · Commission with growth path",
    blurb:
      "Bring ELSIAA to businesses that need us. Commission-based with real upside, hands-on training from leadership, and a written path to a bigger seat.",
    points: [
      "Content, campaigns, and direct client generation",
      "Trained personally in AI, sales, and strategy",
      "Compensation scales with the clients you bring",
    ],
  },
  {
    num: "04",
    cat: "Leadership",
    name: "Regional Business Director",
    type: "By city · Relationship-driven",
    blurb:
      "Own ELSIAA's presence in your market the way our directors do in Europe and California — the face of the company where you live.",
    points: [
      "Build and hold client relationships in your region",
      "Local network, global product behind you",
      "Entrepreneurial seat inside a growing company",
    ],
  },
];

function Careers() {
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
            Careers at ELSIAA
          </p>
          <h1
            className="mx-auto mt-4 max-w-4xl text-5xl font-semibold tracking-[-0.04em] md:text-8xl"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Build the empire.
          </h1>
          <p
            className="mx-auto mt-6 max-w-xl text-lg text-[#111111]/50 md:text-xl"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            We hire builders — people who treat every detail like it matters.
            Because here, it does.
          </p>
        </Reveal>
      </section>

      {/* values */}
      <section className="bg-[#F5F5F3] px-6 pb-20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v, i) => (
            <Reveal key={v.title} delay={i * 0.06}>
              <div className="border-t border-black/10 pt-5">
                <h3
                  className="text-lg font-semibold tracking-[-0.02em]"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {v.title}
                </h3>
                <p
                  className="mt-2.5 text-[14px] leading-relaxed text-[#111111]/55"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {v.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* roles */}
      <section className="bg-[#F5F5F3] px-6 pb-24">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p
              className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Open roles
            </p>
            <h2
              className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.035em] md:text-5xl"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Pick your seat.
            </h2>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
            {ROLES.map((r, i) => (
              <Reveal key={r.num} delay={(i % 2) * 0.08}>
                <div className="group flex h-full flex-col rounded-2xl border border-black/[0.06] bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:border-[#1e6b3c]/30 hover:shadow-[0_28px_70px_-32px_rgba(30,107,60,0.35)]">
                  <div className="flex items-baseline justify-between">
                    <p
                      className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      {r.cat}
                    </p>
                    <span
                      className="text-2xl font-semibold text-black/[0.12] transition-colors duration-300 group-hover:text-[#1e6b3c]/25"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      {r.num}
                    </span>
                  </div>
                  <h3
                    className="mt-3 text-2xl font-semibold tracking-[-0.035em] md:text-3xl"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {r.name}
                  </h3>
                  <p
                    className="mt-1 text-[11px] tracking-[0.18em] text-[#111111]/40 uppercase"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {r.type}
                  </p>
                  <p
                    className="mt-3 text-[15px] leading-relaxed text-[#111111]/55"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {r.blurb}
                  </p>
                  <ul className="mt-5 space-y-2.5">
                    {r.points.map((pt) => (
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
                      href={`mailto:isya@elsiaa.com?subject=Application%20—%20${encodeURIComponent(r.name)}`}
                      className="inline-flex items-center gap-2 rounded-full border border-[#111111]/20 px-6 py-2.5 text-[10px] tracking-[0.26em] text-[#111111] uppercase transition-all duration-300 group-hover:border-[#1e6b3c] group-hover:bg-[#1e6b3c] group-hover:text-white"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      Apply
                      <span>→</span>
                    </a>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1}>
            <p
              className="mt-10 text-center text-[14px] text-[#111111]/50"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Don&rsquo;t see your seat?{" "}
              <a
                href="mailto:isya@elsiaa.com?subject=Pitch%20—%20my%20role%20at%20ELSIAA"
                className="text-[#1e6b3c] underline-offset-4 hover:underline"
              >
                Pitch us the role you&rsquo;d create.
              </a>
            </p>
          </Reveal>
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
            The empire is hiring its builders.
          </h2>
          <a
            href="mailto:isya@elsiaa.com?subject=Application"
            className="group mt-12 inline-flex items-center gap-3 rounded-full border border-[#F5F5F3]/25 px-9 py-3.5 text-[11px] tracking-[0.3em] uppercase transition-colors duration-300 hover:border-[#2e9e58] hover:text-[#2e9e58]"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Apply now
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
          <p className="mt-3 text-sm text-[#F5F5F3]/45">בעזרת ה׳ נעשה ונצליח</p>
        </Reveal>
      </section>
    </main>
  );
}
