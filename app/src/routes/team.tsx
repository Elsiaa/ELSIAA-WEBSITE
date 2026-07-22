import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "../components/SiteNav";
import { Reveal } from "../components/Reveal";

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
      { property: "og:image", content: "https://elsiaa.higgsfield.app/assets/og_cover.png" },
    ],
    links: [{ rel: "canonical", href: "https://elsiaa.higgsfield.app/team" }],
  }),
  component: TeamPage,
});

const SANS =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif";
const MONO = "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace";

type Person = {
  name: string;
  init: string;
  role: string;
  line: string;
  loc: string;
};

const LEADERSHIP: Person[] = [
  {
    name: "Yisrael Krug",
    init: "YK",
    role: "Founder & CEO",
    line: "Sets the standard and holds the line on it. One bar for everything ELSIAA ships: would we sign our name to it.",
    loc: "New York",
  },
  {
    name: "David Heimowitz",
    init: "DH",
    role: "Co-Founder & CTO",
    line: "Owns the engineering. If it ships from ELSIAA it ships hardened, tested, and insured — no excuses.",
    loc: "New York",
  },
  {
    name: "Jacob Rubelow",
    init: "JR",
    role: "Executive Legal & Strategic Counsel",
    line: "Keeps ambition and liability on the same page. Structures the agreements that protect every client.",
    loc: "New York",
  },
];

const DIRECTORS: Person[] = [
  {
    name: "Chaim Lieberman",
    init: "CL",
    role: "Director, European Business",
    line: "The front door to ELSIAA in Europe — a natural builder of relationships across the continent.",
    loc: "Geneva / Antwerp",
  },
  {
    name: "Izzy Eisenberg",
    init: "IE",
    role: "Director, California Business",
    line: "West Coast to the core. Drives California operations and the client relationships that come with it.",
    loc: "Los Angeles",
  },
  {
    name: "Ynon Azulai",
    init: "YA",
    role: "AI & Technology Expert",
    line: "At the edge of applied AI — the deep-tech eye on every architecture ELSIAA ships.",
    loc: "Jerusalem / Tel Aviv",
  },
];

const ADVISORS: Person[] = [
  {
    name: "Mendel Parnas",
    init: "MP",
    role: "Chairman & Advisor · Insurance",
    line: "Chairs the advisory board. The insurance mind behind ELSIAA's fully-insured guarantee.",
    loc: "Insurance",
  },
  {
    name: "Berel Krug",
    init: "BK",
    role: "Executive Advisor · Healthcare",
    line: "Advises the executive team on healthcare operations and market strategy across our engagements.",
    loc: "Healthcare",
  },
];

const ACADEMIC: Person[] = [
  {
    name: "Dr. Esther Krug, MD",
    init: "EK",
    role: "Professor of Medicine, Johns Hopkins",
    line: "Brings academic medical leadership to ELSIAA's advisory board, grounding clinical work in real practice.",
    loc: "Johns Hopkins",
  },
  {
    name: "Dr. Edward Margolin, MD",
    init: "EM",
    role: "Professor of Medicine, University of Toronto",
    line: "Clinical rigor from the Depts. of Ophthalmology and Neurology behind ELSIAA's medical work.",
    loc: "University of Toronto",
  },
];

function Monogram({ init }: { init: string }) {
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-black/[0.06] bg-[#F5F5F3] transition-colors duration-300 group-hover:border-[#1e6b3c]/25">
      {/* corner diamond mark */}
      <span className="absolute top-3 right-3 h-[7px] w-[7px] rotate-45 bg-[#1e6b3c]/70" />
      <span
        className="flex h-full w-full items-center justify-center text-4xl font-semibold tracking-[-0.03em] text-[#111111]/80 transition-transform duration-500 group-hover:scale-[1.04] md:text-5xl"
        style={{ fontFamily: SANS }}
      >
        {init}
      </span>
    </div>
  );
}

function Card({ p, i }: { p: Person; i: number }) {
  return (
    <Reveal delay={i * 0.05}>
      <div className="group rounded-2xl border border-black/[0.07] bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#1e6b3c]/30">
        <Monogram init={p.init} />
        <h3
          className="mt-4 text-[17px] leading-[1.12] font-semibold tracking-[-0.015em] text-[#111111]"
          style={{ fontFamily: SANS }}
        >
          {p.name}
        </h3>
        <p
          className="mt-1.5 text-[11px] tracking-[0.14em] text-[#1e6b3c] uppercase"
          style={{ fontFamily: MONO }}
        >
          {p.role}
        </p>
        <p className="mt-2.5 text-[13px] leading-relaxed text-[#111111]/55" style={{ fontFamily: SANS }}>
          {p.line}
        </p>
        <div className="mt-4 flex items-center gap-2 border-t border-black/[0.06] pt-3">
          <span className="h-[5px] w-[5px] rotate-45 bg-[#1e6b3c]/50" />
          <span
            className="text-[10px] tracking-[0.2em] text-[#111111]/45 uppercase"
            style={{ fontFamily: MONO }}
          >
            {p.loc}
          </span>
        </div>
      </div>
    </Reveal>
  );
}

function Group({
  label,
  people,
  border,
}: {
  label: string;
  people: Person[];
  border?: boolean;
}) {
  return (
    <section
      className={`mx-auto max-w-6xl px-6 py-12 md:py-14 ${border ? "border-t border-black/[0.06]" : ""}`}
    >
      <Reveal>
        <h2
          className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase"
          style={{ fontFamily: MONO }}
        >
          {label}
        </h2>
      </Reveal>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {people.map((p, i) => (
          <Card key={p.name} p={p} i={i} />
        ))}
      </div>
    </section>
  );
}

function TeamPage() {
  return (
    <main className="min-h-screen bg-white text-[#111111]">
      <SiteNav />

      {/* hero */}
      <section className="mx-auto max-w-6xl px-6 pt-40 pb-6 md:pt-44">
        <Reveal>
          <p
            className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase"
            style={{ fontFamily: MONO }}
          >
            Who we are
          </p>
          <h1
            className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-0.04em] md:text-6xl"
            style={{ fontFamily: SANS }}
          >
            Leadership of consequence.
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[#111111]/55" style={{ fontFamily: SANS }}>
            Founders, operators, and tenured professors of medicine — sitting at
            one table, holding one standard.
          </p>
          <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-t border-black/[0.06] pt-6">
            {[
              ["10", "Leaders & advisors"],
              ["06", "Cities on the ground"],
              ["03", "Continents"],
              ["100%", "Insured builds"],
            ].map(([n, l]) => (
              <div key={l}>
                <p
                  className="text-2xl font-semibold tracking-[-0.03em] text-[#111111]"
                  style={{ fontFamily: SANS }}
                >
                  {n}
                </p>
                <p
                  className="mt-1 text-[10px] tracking-[0.22em] text-[#111111]/55 uppercase"
                  style={{ fontFamily: MONO }}
                >
                  {l}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <Group label="01 · Leadership" people={LEADERSHIP} />
      <Group label="02 · Directors" people={DIRECTORS} border />
      <Group label="03 · Advisors" people={ADVISORS} border />
      <Group label="04 · Academic" people={ACADEMIC} border />

      {/* credibility band */}
      <section className="border-t border-black/[0.06] bg-[#F5F5F3]">
        <div className="mx-auto max-w-6xl px-6 py-12 text-center md:py-14">
          <Reveal>
            <p
              className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase"
              style={{ fontFamily: MONO }}
            >
              The measure of it
            </p>
            <p
              className="mx-auto mt-4 max-w-3xl text-xl font-semibold tracking-[-0.02em] text-[#111111] md:text-2xl"
              style={{ fontFamily: SANS }}
            >
              Johns Hopkins · University of Toronto · six cities · fully insured builds.
            </p>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl border-t border-black/[0.06] px-6 py-16 text-center">
        <Reveal>
          <p
            className="text-lg font-semibold tracking-[-0.02em] md:text-2xl"
            style={{ fontFamily: SANS }}
          >
            Bring us the work that has to be right.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/contact"
              className="inline-flex items-center gap-3 rounded-full bg-[#111111] px-8 py-4 text-[11px] font-bold tracking-[0.22em] text-white uppercase transition-all duration-300 hover:bg-[#1e6b3c]"
              style={{ fontFamily: MONO }}
            >
              Meet with us →
            </a>
          </div>
          <p
            title="With God's help we shall do and succeed."
            className="mt-12 cursor-help text-[11px] tracking-[0.2em] text-[#111111]/50 uppercase"
            style={{ fontFamily: MONO }}
          >
            בעזרת ה׳ נעשה ונצליח
          </p>
        </Reveal>
      </section>
    </main>
  );
}
