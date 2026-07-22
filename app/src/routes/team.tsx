import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SiteNav } from "../components/SiteNav";

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title: "Leadership — ELSIAA · AI Done Better" },
      {
        name: "description",
        content:
          "The leadership, counsel, and medical advisory board behind ELSIAA — an international AI services firm.",
      },
      { property: "og:title", content: "Leadership — ELSIAA" },
      { property: "og:image", content: "/assets/og_cover.png" },
    ],
  }),
  component: TeamPage,
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

const LEADERSHIP = [
  {
    name: "Yisrael Krug",
    role: "Founder & Chief Executive Officer",
    init: "YK",
    line: "Builder across retail, software, and services. Sets one bar for everything ELSIAA ships: would we sign our name to it.",
  },
  {
    name: "David Heimowitz",
    role: "Co-Founder & Chief Technology Officer",
    init: "DH",
    line: "Engineer at heart. Owns the architecture, the infrastructure, and the culture that keeps ELSIAA systems running without excuses.",
  },
  {
    name: "Jacob Rubelow",
    role: "Executive Legal & Strategic Counsel",
    init: "JR",
    line: "The firm's counsel. Structures the agreements, protects the clients, keeps five offices clean in every jurisdiction we touch.",
  },
  {
    name: "Chaim Lieberman",
    role: "Director of European Business",
    init: "CL",
    line: "A natural relationship builder. The front door to ELSIAA in Europe — London, Antwerp, and Geneva answer to him.",
  },
  {
    name: "Izzy Eisenberg",
    role: "Director of California Business",
    init: "IE",
    line: "West Coast to the core. Drives California operations and the client relationships that come with the territory.",
  },
];

const ADVISORY = [
  {
    name: "Mendel Parnas",
    role: "Chairman & Advisor · Insurance Expert",
    init: "MP",
    line: "Chairs the advisory board. The insurance mind behind ELSIAA's fully-insured guarantee — every build we ship is covered because he makes sure it can be.",
  },
  {
    name: "Berel Krug",
    role: "Executive Advisor · Healthcare Consultant",
    init: "BK",
    line: "Advises the executive team on healthcare operations and market strategy across ELSIAA's healthcare engagements.",
  },
  {
    name: "Dr. Esther Krug, MD",
    role: "Professor of Medicine, Johns Hopkins University",
    init: "EK",
    line: "Brings academic medical leadership to ELSIAA's healthcare advisory board, grounding our clinical work in real practice.",
  },
  {
    name: "Dr. Edward Margolin, MD",
    role: "Professor, University of Toronto",
    init: "EM",
    line: "Professor in the Dept. of Ophthalmology & Visual Sciences and the Division of Neurology, and Director of the Neuro-Ophthalmology and Strabismus Fellowship — clinical rigor behind ELSIAA's medical work.",
  },
];

function Portrait({ init }: { init: string }) {
  return (
    <div className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-xl border border-black/[0.06] bg-[#FAFAF8] transition-colors duration-300 group-hover:border-[#1e6b3c]/25">
      {/* placeholder portrait — photography incoming */}
      <span
        className="text-6xl font-semibold tracking-[-0.04em] text-[#1e6b3c]/25 transition-colors duration-300 group-hover:text-[#1e6b3c]/45"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {init}
      </span>
      <span
        className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[9px] tracking-[0.3em] text-[#111111]/30 uppercase"
        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
      >
        ELSIAA
      </span>
    </div>
  );
}

function Card({
  p,
  i,
}: {
  p: (typeof LEADERSHIP)[number];
  i: number;
}) {
  return (
    <Reveal delay={i * 0.06}>
      <div className="group rounded-2xl border border-black/[0.07] bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#1e6b3c]/35 hover:shadow-[0_24px_60px_-40px_rgba(17,17,17,0.4)]">
        <Portrait init={p.init} />
        <h3
          className="mt-4 text-[17px] leading-[1.12] font-semibold tracking-[-0.015em] text-[#111111]"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {p.name.split(" ").slice(0, 1).join(" ")}
          <br />
          {p.name.split(" ").slice(1).join(" ")}
        </h3>
        <p
          className="mt-1 text-[11px] tracking-[0.14em] text-[#1e6b3c] uppercase"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          {p.role}
        </p>
        <p
          className="mt-2.5 text-[13px] leading-relaxed text-[#111111]/55"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {p.line}
        </p>
      </div>
    </Reveal>
  );
}

function TeamPage() {
  return (
    <main className="min-h-screen bg-white text-[#111111]">
      <SiteNav />
      {/* hero */}
      <section className="mx-auto max-w-6xl px-6 pt-40 pb-4 md:pt-44">
        <Reveal>
          <p
            className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Who we are
          </p>
          <h1
            className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-0.04em] md:text-6xl"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Meet the pride.
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[#111111]/55">
            An international executive team, dedicated counsel, and a medical
            advisory board — one standard across five offices and three
            continents.
          </p>
          <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-t border-black/[0.06] pt-6">
            {[
              ["09", "Leaders & advisors"],
              ["06", "Cities on the ground"],
              ["03", "Continents"],
              ["24/7", "Support, every timezone"],
            ].map(([n, l]) => (
              <div key={l}>
                <p
                  className="text-2xl font-semibold tracking-[-0.03em] text-[#111111]"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {n}
                </p>
                <p
                  className="mt-1 text-[10px] tracking-[0.22em] text-[#111111]/40 uppercase"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {l}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* executive team */}
      <section className="mx-auto max-w-6xl px-6 py-14 md:py-16">
        <Reveal>
          <h2
            className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            01 · Executive Team
          </h2>
        </Reveal>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LEADERSHIP.map((p, i) => (
            <Card key={p.name} p={p} i={i} />
          ))}
        </div>
      </section>

      {/* advisory board */}
      <section className="mx-auto max-w-6xl border-t border-black/[0.06] px-6 py-14 md:py-16">
        <Reveal>
          <h2
            className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            02 · Medical & Strategic Advisory
          </h2>
        </Reveal>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ADVISORY.map((p, i) => (
            <Card key={p.name} p={p} i={i} />
          ))}
        </div>
      </section>

      {/* closing */}
      <section className="mx-auto max-w-6xl border-t border-black/[0.06] px-6 py-16 text-center">
        <Reveal>
          <p
            className="text-lg font-semibold tracking-[-0.02em] md:text-2xl"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Want a seat at this table?
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/careers"
              className="inline-flex items-center gap-3 rounded-full bg-[#111111] px-8 py-4 text-[11px] font-bold tracking-[0.22em] text-white uppercase transition-all duration-300 hover:bg-[#1e6b3c]"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              We are hiring →
            </a>
            <a
              href="/contact"
              className="inline-flex items-center gap-3 rounded-full border border-[#111111]/15 px-8 py-4 text-[11px] font-bold tracking-[0.22em] text-[#111111] uppercase transition-all duration-300 hover:border-[#1e6b3c] hover:text-[#1e6b3c]"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Talk to the team
            </a>
          </div>
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
