import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "../components/SiteNav";
import { Reveal } from "../components/Reveal";
import { absoluteUrl } from "../lib/site-url";

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
      { property: "og:image", content: absoluteUrl("/assets/og_cover.png") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/team") }],
  }),
  component: TeamPage,
});

const SANS = "var(--font-sans)";
const MONO = "var(--font-sans)";

type Person = {
  name: string;
  init: string;
  photo?: string;
  /**
   * object-position Y, as a percentage.
   *
   * Not eyeballed and not shared between people — each is computed from where
   * the face actually sits in that specific file. The plate is aspect-[4/5]
   * (0.8) and every source is portrait (0.62–0.75), so object-cover matches
   * width and overflows vertically by `1 - 1.25 * imageAspect`. The value is
   * solved so the eyes land ~35% down the visible window (upper third) while
   * keeping at least 3.5% of background above the top of the head.
   *
   * Re-run the measurement if a photo is replaced — do not copy a neighbour's.
   *
   * jr.jpg and em.jpg were also rescaled at the source: both were shot much
   * tighter than the rest (their heads ran off the top of the frame), and no
   * object-position can zoom out — it only pans. Each subject was scaled down
   * inside its own canvas with the backdrop extended by edge-smear, so the
   * dark green vignette continues rather than showing a seam. Originals are
   * kept in public/assets/team/.orig/.
   *
   * em is anchored to the BOTTOM of its canvas, which is why its focus is 93
   * while jr's is 16 — the two numbers are not comparable. Smearing the bottom
   * edge dragged the white shirt and tie into hard vertical stripes with a
   * visible seam across the shoulders. Anchoring the subject to the bottom
   * means only backdrop is ever extended, and the plate's own crop removes the
   * rest. Extend body pixels and it will look like a printing fault.
   */
  focus?: number;
  role: string;
  line: string;
  loc: string;
  href?: string;
  hrefLabel?: string;
};

const LEADERSHIP: Person[] = [
  {
    name: "Yisrael Krug",
    init: "YK",
    photo: "/assets/team/yk.jpg",
    focus: 0,
    role: "Founder & CEO",
    line: "Former executive at Dialog Healthcare, founder of the Mitzva App (non-profit), and artist at Gestalt-Art.com. Background in biology, psychology, and business, grounded in intensive Talmudic study; lectures in Torah at Ahavas Chaim in Baltimore, MD.",
    loc: "New York",
    href: "mailto:yisrael@elsiaa.com",
    hrefLabel: "yisrael@elsiaa.com",
  },
  {
    name: "David Heimowitz",
    init: "DH",
    photo: "/assets/team/dh.jpg",
    focus: 4,
    role: "Co-Founder & CTO",
    line: "Owns the engineering. If it ships from ELSIAA it ships hardened, tested, and insured — no excuses.",
    loc: "New Jersey",
    href: "mailto:davidh@elsiaa.com",
    hrefLabel: "davidh@elsiaa.com",
  },
  {
    name: "Jacob Rubelow",
    init: "JR",
    photo: "/assets/team/jr.jpg",
    focus: 16,
    role: "Partner & Chief Operating Officer",
    line: "Strategist and partner. Bachelor's in mathematics, magna cum laude, from Touro University; George Washington University Law School; background in intensive Talmudic study. Active EMT and firefighter.",
    loc: "New York",
    href: "mailto:jacob@elsiaa.com",
    hrefLabel: "jacob@elsiaa.com",
  },
];

const DIRECTORS: Person[] = [
  {
    name: "Chaim Lieberman",
    init: "CL",
    photo: "/assets/team/cl.jpg",
    focus: 0,
    role: "Executive Director & Partner",
    line: "Former CEO of Libersilver and former fund manager at a Belgian private fund. Based in Antwerp, operating across all of Western Europe and Israel.",
    loc: "Antwerp",
    href: "mailto:chaim@elsiaa.com",
    hrefLabel: "chaim@elsiaa.com",
  },
  {
    name: "Izzy Eisenberg",
    init: "IE",
    role: "Director, California Business",
    line: "West Coast to the core. Drives California operations and the client relationships that come with it.",
    loc: "Los Angeles",
    href: "mailto:izzy@elsiaa.com",
    hrefLabel: "izzy@elsiaa.com",
  },
  {
    name: "David Spivak",
    init: "DS",
    /* add photo: "/assets/team/ds.jpg" once a headshot is supplied */
    role: "Director of Social Media",
    line: "Runs ELSIAA's social output end to end — strategy, production, and the accounts themselves.",
    loc: "New York",
    /* utm_source=linktree_profile_share stripped: it tags the share that
       produced the link, and would mis-attribute every visitor from the site. */
    href: "https://linktr.ee/spivak_photography",
    hrefLabel: "linktr.ee/spivak_photography",
  },
  {
    name: "Ynon Azulai",
    init: "YA",
    photo: "/assets/team/ya.jpg",
    focus: 23,
    role: "AI & Technology Expert",
    line: "At the edge of applied AI — the deep-tech eye on every architecture ELSIAA ships.",
    loc: "Jerusalem / Tel Aviv",
  },
];

const ADVISORS: Person[] = [
  {
    name: "Dr. Edward Margolin, MD, FRCSC, Dipl. ABO",
    init: "EM",
    photo: "/assets/team/em.jpg",
    focus: 93,
    role: "Healthcare Advisor",
    line: "Professor, University of Toronto — Dept. of Ophthalmology and Visual Sciences; Dept. of Medicine, Division of Neurology. Director, Neuro-Ophthalmology and Strabismus Fellowship.",
    loc: "University of Toronto",
    href: "mailto:drmargolin@elsiaa.com",
    hrefLabel: "drmargolin@elsiaa.com",
  },
];

function Plate({ p }: { p: Person }) {
  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[#0d0f0e] ring-1 ring-black/[0.06] transition-all duration-300 group-hover:ring-[#1e6b3c]/30">
      {p.photo ? (
        <img
          src={p.photo}
          alt={p.name}
          loading="lazy"
          style={{ objectPosition: `center ${p.focus ?? 35}%` }}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center text-5xl font-semibold tracking-[-0.03em] text-white/85 transition-transform duration-500 group-hover:scale-[1.03]"
          style={{
            fontFamily: SANS,
            background:
              "radial-gradient(120% 90% at 62% 38%, rgba(30,107,60,0.30), rgba(13,15,14,0) 62%)",
          }}
        >
          {p.init}
        </span>
      )}
      <span className="absolute top-3.5 right-3.5 h-[7px] w-[7px] rotate-45 bg-[#2e9e58]/80" />
    </div>
  );
}

function Card({ p, i }: { p: Person; i: number }) {
  return (
    /* h-full on the wrapper too, or the card cannot stretch to the row height
       and h-full on the article does nothing */
    <Reveal delay={Math.min(i * 0.05, 0.2)} className="h-full">
      <article className="group flex h-full flex-col rounded-3xl border border-black/[0.07] bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#1e6b3c]/30 hover:shadow-[0_30px_70px_-45px_rgba(17,17,17,0.35)]">
        <Plate p={p} />
        <div className="flex flex-1 flex-col px-1.5 pt-5 pb-1">
          <h3
            className="text-[18px] leading-[1.15] font-semibold tracking-[-0.02em] text-[#111111]"
            style={{ fontFamily: SANS }}
          >
            {p.name}
          </h3>
          <p
            className="mt-1.5 text-[13px] font-semibold text-[#1e6b3c]"
            style={{ fontFamily: SANS }}
          >
            {p.role}
          </p>
          <p
            className="mt-3 line-clamp-4 text-[13.5px] leading-relaxed text-[#111111]/55"
            style={{ fontFamily: SANS }}
          >
            {p.line}
          </p>
          <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-black/[0.06] pt-4">
            <span
              className="flex items-center gap-2 text-[13px] text-[#111111]/45"
              style={{ fontFamily: SANS }}
            >
              <span className="h-[5px] w-[5px] rotate-45 bg-[#1e6b3c]/50" />
              {p.loc}
            </span>
            {p.href && (
              <a
                href={p.href}
                /* mailto: stays in place; an external profile opens in a new
                   tab and gets rel=noreferrer */
                {...(p.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
                className="ml-auto text-[13px] font-semibold text-[#1e6b3c] transition-colors hover:text-[#111111]"
                style={{ fontFamily: SANS }}
              >
                {p.hrefLabel ?? "Contact"} →
              </a>
            )}
          </div>
        </div>
      </article>
    </Reveal>
  );
}

function Group({ label, people, border }: { label: string; people: Person[]; border?: boolean }) {
  return (
    <section
      className={`mx-auto max-w-6xl px-6 py-12 md:py-14 ${border ? "border-t border-black/[0.06]" : ""}`}
    >
      <Reveal>
        <div className="flex items-center gap-4">
          <h2
            className="text-[12px] font-semibold tracking-[0.14em] text-[#1e6b3c] uppercase"
            style={{ fontFamily: SANS }}
          >
            {label}
          </h2>
          <span className="h-px flex-1 bg-black/[0.08]" />
        </div>
      </Reveal>
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
      <section className="mx-auto max-w-6xl px-6 pt-32 pb-6 md:pt-44">
        <Reveal>
          <h1
            className="max-w-3xl text-4xl font-semibold tracking-[-0.04em] md:text-6xl"
            style={{ fontFamily: SANS }}
          >
            Meet the ELSIAA team.
          </h1>
          {/* Founder's account of why the company exists — kept in first person
              because that is what makes it worth reading. */}
          <div className="mt-5 max-w-2xl space-y-3 text-[15px] leading-relaxed text-[#111111]/65 md:text-[16px]">
            <p style={{ fontFamily: SANS }}>
              ELSIAA started with a frustration. I needed an app built, and every quote that came
              back was too expensive — so I worked it out myself. What I learned along the way is
              that AI needs a professional, and more than that, it needs an honest one.
            </p>
            <p style={{ fontFamily: SANS }}>
              So together with David I built ELSIAA: a service that actually transforms a business,
              on an honest process, with real accountability. We are fully insured, and we are
              driven to deliver a product you are completely satisfied with.
            </p>
            <p className="font-semibold text-[#111111]" style={{ fontFamily: SANS }}>
              Your success is our mission.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-t border-black/[0.06] pt-6">
            {[
              ["7", "Leaders & advisors"],
              ["6", "Cities on the ground"],
              ["3", "Continents"],
              ["100%", "Insured builds"],
            ].map(([n, l]) => (
              <div key={l}>
                <p
                  className="text-2xl font-semibold tracking-[-0.03em] text-[#111111]"
                  style={{ fontFamily: SANS }}
                >
                  {n}
                </p>
                <p className="mt-1 text-[13px] text-[#111111]/55 " style={{ fontFamily: MONO }}>
                  {l}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <Group label="Leadership" people={LEADERSHIP} />
      <Group label="Directors" people={DIRECTORS} border />
      <Group label="Advisory" people={ADVISORS} border />

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-10 md:py-16 text-center">
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
              className="inline-flex items-center gap-3 rounded-full bg-[#111111] px-8 py-4 text-[13px] font-bold text-white  transition-all duration-300 hover:bg-[#1e6b3c]"
              style={{ fontFamily: MONO }}
            >
              Meet with us →
            </a>
          </div>
          <p
            title="With God's help we shall do and succeed."
            className="mt-9 cursor-help text-[13px] text-[#111111]/50 "
            style={{ fontFamily: MONO }}
          >
            בעזרת ה׳ נעשה ונצליח
          </p>
        </Reveal>
      </section>
    </main>
  );
}
