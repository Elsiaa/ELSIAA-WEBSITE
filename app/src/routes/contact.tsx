import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "../components/SiteNav";
import { Reveal } from "../components/Reveal";
import { CALL_HREF, CALL_LABEL } from "../components/ConsultOptions";
import { absoluteUrl } from "../lib/site-url";

/*
  One clean hub: every way to start with ELSIAA on a single minimalist page.
  Free call · paid hour · project quote · direct email — then the offices line.
*/

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — ELSIAA · AI Done Better" },
      {
        name: "description",
        content:
          "Start with a free 20-minute call, book a paid hour with a specialist, or request a quote for a project. Offices in six cities.",
      },
      { property: "og:title", content: "Contact — ELSIAA" },
      { property: "og:image", content: absoluteUrl("/assets/og_cover.png") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/contact") }],
  }),
  component: ContactPage,
});

const SANS = "var(--font-sans)";
const OFFICES = "New York · Los Angeles · London · Geneva · Antwerp · Tel Aviv";

type Path = {
  eyebrow: string;
  title: string;
  price: string;
  line: string;
  cta: string;
  href: string;
  featured?: boolean;
  external?: boolean;
};

const PATHS: Path[] = [
  {
    eyebrow: "Start here",
    title: "Free 20-minute call",
    price: "Free",
    line: "Tell us what you're dealing with. No pitch, no charge.",
    cta: CALL_LABEL,
    href: CALL_HREF,
    external: true,
  },
  {
    eyebrow: "Go deeper",
    title: "1-hour consult",
    price: "$120",
    line: "A full hour with a specialist. You leave with a clear plan of what to do next.",
    cta: "Book the hour",
    href: "/consultation",
    featured: true,
  },
  {
    eyebrow: "Have a project",
    title: "Get a quote",
    price: "Scoped",
    line: "Websites, apps, automation, backend. A clear plan and price within 3 days.",
    cta: "Request a quote",
    href: "/quote",
  },
];

function ContactPage() {
  return (
    <main className="min-h-screen bg-white text-[#111111]" style={{ fontFamily: SANS }}>
      <SiteNav />

      {/* hero */}
      <section className="mx-auto max-w-6xl px-6 pt-36 pb-8 text-center md:pt-44 md:pb-16">
        <Reveal>
          <h1 className="text-5xl font-semibold tracking-[-0.045em] md:text-7xl">Let's talk.</h1>
          <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-[#111111]/55 md:text-[17px]">
            Three ways to start. Pick whichever fits — the first twenty minutes are always free.
          </p>
        </Reveal>
      </section>

      {/* the three paths */}
      <section className="mx-auto max-w-6xl px-6 pb-9 md:pb-16">
        <Reveal delay={0.06}>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
            {PATHS.map((p) => (
              <a
                key={p.title}
                href={p.href}
                {...(p.external ? {} : {})}
                className={`group flex flex-col rounded-3xl border bg-white p-8 transition-all duration-300 hover:-translate-y-1 ${
                  p.featured
                    ? "border-[#1e6b3c]/35 shadow-[0_30px_70px_-45px_rgba(30,107,60,0.45)]"
                    : "border-black/[0.08] shadow-[0_24px_60px_-50px_rgba(17,17,17,0.4)] hover:border-[#1e6b3c]/35"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {p.eyebrow === "Start here" && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#1e6b3c"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.3 1.8.6 2.7a2 2 0 01-.4 2.1L8.1 9.7a16 16 0 006 6l1.2-1.2a2 2 0 012.1-.4c.9.3 1.8.5 2.7.6a2 2 0 011.7 2z" />
                    </svg>
                  )}
                  <p className="text-[12px] font-semibold tracking-[0.1em] text-[#1e6b3c] uppercase">
                    {p.eyebrow}
                  </p>
                </div>
                <h2 className="mt-3 text-[21px] font-semibold tracking-[-0.03em] md:text-[23px]">
                  {p.title}
                </h2>
                <p className="mt-4 text-[32px] font-semibold leading-none tracking-[-0.04em] md:text-[38px]">
                  {p.price}
                </p>
                <p className="mt-5 mb-8 text-[15px] leading-relaxed text-[#111111]/60">{p.line}</p>
                <span
                  className={`mt-auto flex w-full items-center justify-center rounded-full px-6 py-4 text-[15px] font-semibold transition-all duration-300 ${
                    p.featured
                      ? "bg-[#111111] text-white shadow-[0_14px_36px_-14px_rgba(17,17,17,0.5)] group-hover:bg-[#1e6b3c]"
                      : "border border-[#111111]/15 text-[#111111] group-hover:border-[#1e6b3c] group-hover:bg-[#1e6b3c] group-hover:text-white"
                  }`}
                >
                  {p.cta}
                </span>
              </a>
            ))}
          </div>
        </Reveal>
      </section>

      {/* direct */}
      <section className="border-t border-black/[0.06] bg-[#F5F5F3]">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-8 md:py-12 text-center md:flex-row md:justify-between md:text-left">
          <Reveal>
            <p className="text-[13px] font-semibold text-[#1e6b3c]">Direct</p>
            <a
              href="mailto:info@elsiaa.com"
              className="mt-1 block text-[22px] font-semibold tracking-[-0.02em] text-[#111111] transition-colors hover:text-[#1e6b3c] md:text-[26px]"
            >
              info@elsiaa.com
            </a>
          </Reveal>
          <Reveal delay={0.06}>
            <p className="text-[13px] text-[#111111]/45">{OFFICES}</p>
            <p className="mt-1 text-[13px] text-[#111111]/45">
              Visits by appointment · virtual support 24/7 · every engagement fully insured
            </p>
          </Reveal>
        </div>
      </section>

      {/* how it goes */}
      <section className="mx-auto max-w-6xl px-6 py-9 md:py-16">
        <Reveal>
          <h2 className="text-2xl font-semibold tracking-[-0.03em] md:text-3xl">
            What happens next.
          </h2>
        </Reveal>
        <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["01", "We talk", "Twenty minutes to understand the problem."],
            ["02", "Scoped plan", "A clear plan and price within three days."],
            ["03", "We build", "Designed and built, reviewed as we go."],
            ["04", "It ships", "Live in your business — and we keep it running."],
          ].map(([n, t, d], i) => (
            <Reveal key={n} delay={i * 0.05}>
              <div className="border-t border-black/10 pt-4">
                <p className="text-[12px] font-bold tracking-[0.14em] text-[#1e6b3c]">{n}</p>
                <h3 className="mt-2 text-[16px] font-semibold tracking-[-0.02em]">{t}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-[#111111]/55">{d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  );
}
