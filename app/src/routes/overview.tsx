import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "../components/SiteNav";
import { Reveal } from "../components/Reveal";
import { absoluteUrl } from "../lib/site-url";

export const Route = createFileRoute("/overview")({
  head: () => ({
    meta: [
      { title: "Overview — ELSIAA · AI Done Better" },
      {
        name: "description",
        content:
          "We build the systems that run your company — custom AI, automation, and world-class design, scoped, priced, and proven before you spend a dollar.",
      },
      { property: "og:title", content: "Overview — ELSIAA" },
      {
        property: "og:description",
        content:
          "Custom AI, automation, and world-class design — proven before you spend a dollar.",
      },
      { property: "og:image", content: absoluteUrl("/assets/og_cover.png") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/overview") }],
  }),
  component: Overview,
});

const sans = {
  fontFamily: "var(--font-sans)",
} as const;

const SHIP: Array<{
  num: string;
  title: string;
  blurb: string;
  cta: string;
  href: string;
}> = [
  {
    num: "01",
    title: "Automation",
    blurb:
      "Work that used to require people now runs without them. Sales, operations, finance, support — end to end.",
    cta: "See live systems",
    href: "/automate",
  },
  {
    num: "02",
    title: "Design",
    blurb: "Every surface your brand touches. Built to convert, not just look good.",
    cta: "Explore design",
    href: "/designs",
  },
  {
    num: "03",
    title: "Strategy",
    blurb: "Clear plans. Fixed scope. Measured results.",
    cta: "Book consultation",
    href: "/contact",
  },
];

function Overview() {
  return (
    <main className="bg-white text-[#111111] antialiased">
      <SiteNav />

      {/* hero */}
      <section className="flex min-h-[64svh] flex-col items-center justify-center bg-white px-6 pt-28 pb-10 md:pb-16 text-center">
        <Reveal>
          <p className="text-[13px] font-bold text-[#1e6b3c]" style={sans}>
            ELSIAA — AI Done Better
          </p>
          <h1
            className="mx-auto mt-4 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-[-0.045em] md:text-7xl"
            style={sans}
          >
            We build the systems that run your company.
          </h1>
          <p
            className="mx-auto mt-6 max-w-xl text-[16px] leading-relaxed text-[#111111]/60 md:text-[18px]"
            style={sans}
          >
            Custom AI, automation, and world-class design — scoped, priced, and proven before you
            spend a dollar.
          </p>
          <a
            href="/contact"
            className="mt-9 inline-flex min-h-[52px] items-center rounded-full bg-[#1e6b3c] px-9 text-[15px] font-semibold text-white transition-all hover:bg-[#111111]"
            style={sans}
          >
            Speak to ELSIAA →
          </a>
        </Reveal>
      </section>

      {/* the gap */}
      <section className="bg-[#F5F5F3] px-6 py-10 text-center text-[#111111] md:py-32">
        <Reveal>
          <h2
            className="mx-auto max-w-3xl text-3xl font-semibold leading-[1.15] tracking-[-0.035em] md:text-5xl"
            style={sans}
          >
            Most businesses still run on manual processes while their competitors use AI as a force
            multiplier.
          </h2>
          <p
            className="mx-auto mt-6 text-[18px] font-semibold text-[#1e6b3c] md:text-2xl"
            style={sans}
          >
            We close that gap.
          </p>
        </Reveal>
      </section>

      {/* what we actually ship */}
      <section className="bg-white px-6 py-10 md:py-16">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="text-[13px] font-bold text-[#1e6b3c]" style={sans}>
              What we actually ship
            </p>
            <h2
              className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.04em] md:text-5xl"
              style={sans}
            >
              Three divisions. One standard.
            </h2>
          </Reveal>

          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {SHIP.map((s, i) => (
              <Reveal key={s.num} delay={i * 80}>
                <div className="flex h-full flex-col rounded-2xl border border-black/[0.08] bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[#1e6b3c]/35 hover:shadow-[0_30px_70px_-45px_rgba(17,17,17,0.35)]">
                  <p
                    className="text-[13px] font-bold tracking-[0.14em] text-[#1e6b3c]"
                    style={sans}
                  >
                    {s.num}
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em]" style={sans}>
                    {s.title}
                  </h3>
                  <p
                    className="mt-3 flex-1 text-[15px] leading-relaxed text-[#111111]/60"
                    style={sans}
                  >
                    {s.blurb}
                  </p>
                  <a
                    href={s.href}
                    className="mt-6 inline-flex items-center gap-1 text-[14px] font-semibold text-[#1e6b3c] transition-colors hover:text-[#111111]"
                    style={sans}
                  >
                    {s.cta} →
                  </a>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* proof first */}
      <section className="bg-[#F5F5F3] px-6 py-10 text-center md:py-32">
        <Reveal>
          <p className="text-[13px] font-bold text-[#1e6b3c]" style={sans}>
            Proof first.
          </p>
          <h2
            className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.04em] md:text-5xl"
            style={sans}
          >
            We don’t sell theory.
          </h2>
          <p
            className="mx-auto mt-5 max-w-md text-[16px] leading-relaxed text-[#111111]/60 md:text-[18px]"
            style={sans}
          >
            We show you the working system before you commit.
          </p>
          <a
            href="/automate"
            className="mt-9 inline-flex min-h-[52px] items-center rounded-full bg-[#1e6b3c] px-9 text-[15px] font-semibold text-white transition-all hover:bg-[#111111]"
            style={sans}
          >
            Walk through real deployments →
          </a>
        </Reveal>
      </section>
    </main>
  );
}
