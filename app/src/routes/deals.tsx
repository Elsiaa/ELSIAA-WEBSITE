import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "../components/SiteNav";
import { Reveal } from "../components/Reveal";
import { absoluteUrl } from "../lib/site-url";

/*
  Deals — the cheapest way into ELSIAA.

  Every price here is one of the published starting prices already used on
  /services and in the site search index ($750 websites, $1,000 backend
  software, $10k apps, $120 consult). Nothing is invented, and nothing claims
  a discount off a "was" price, which would be a pricing claim we can't back.
  Bundles quote the sum of their parts and say so.
*/

export const Route = createFileRoute("/deals")({
  head: () => ({
    meta: [
      /* hidden from navigation: route still resolves for a direct link. */
      { name: "robots", content: "noindex, follow" },
      { title: "Deals — ELSIAA · AI Done Better" },
      {
        name: "description",
        content:
          "The cheapest way to start with ELSIAA. Websites from $750, backend systems from $1,000, and a free 20-minute call before you spend anything.",
      },
      { property: "og:title", content: "Deals — ELSIAA" },
      {
        property: "og:description",
        content: "Websites from $750, backend systems from $1,000, apps from $10k.",
      },
      { property: "og:image", content: absoluteUrl("/assets/og_cover.png") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/deals") }],
  }),
  component: DealsPage,
});

const SANS = "var(--font-sans)";

type Deal = {
  art: string;
  eyebrow: string;
  title: string;
  price: string;
  unit?: string;
  line: string;
  includes: string[];
  href: string;
  cta: string;
  best?: boolean;
};

const DEALS: Deal[] = [
  {
    art: "/assets/social/brand.png",
    eyebrow: "Cheapest way in",
    title: "Starter website",
    price: "$750",
    line: "A real site, live and yours. Designed, written and shipped — no page builder trial, no monthly rent on your own website.",
    includes: [
      "Up to 5 pages, built to convert",
      "Written for you, not templated",
      "Mobile-first and fast",
      "Your domain, your hosting, you own it",
    ],
    href: "/quote?option=Starter%20website",
    cta: "Start a website",
  },
  {
    art: "/assets/why/data.png",
    eyebrow: "Most popular",
    title: "One system that pays for itself",
    price: "$1,000",
    line: "Pick the single job that still waits on a person — missed calls, quote follow-ups, invoice chasing — and we automate that one thing properly.",
    includes: [
      "One workflow, scoped and fixed-price",
      "Built into the tools you already use",
      "Tested and monitored, not left running blind",
      "Handed over documented",
    ],
    href: "/quote?option=Single%20automation",
    cta: "Automate one thing",
    best: true,
  },
  {
    art: "/assets/social/reviews.png",
    eyebrow: "Get found locally",
    title: "Google profile & reviews setup",
    price: "Ask",
    line: "Your Google Business Profile filled in properly, the review request automated, and the map listing actually working for the searches near you.",
    includes: [
      "Profile built out and verified",
      "Review requests sent automatically",
      "Local search and map-pack setup",
      "Reporting on calls and direction taps",
    ],
    href: "/quote?option=Google%20profile%20%26%20reviews",
    cta: "Get a price",
  },
  {
    art: "/assets/social/personal.png",
    eyebrow: "When you're ready",
    title: "Mobile app",
    price: "$10k",
    line: "iOS and Android, built properly and released to the stores. The step you take once the website and the systems are already earning.",
    includes: [
      "iOS and Android from one build",
      "Store submission handled",
      "Backend and accounts included",
      "Maintained after release",
    ],
    href: "/quote?option=App",
    cta: "Scope an app",
  },
];

function DealsPage() {
  return (
    <main className="min-h-screen bg-white text-[#111111]" style={{ fontFamily: SANS }}>
      <SiteNav />

      {/* hero */}
      <section className="mx-auto max-w-6xl px-6 pt-28 pb-8 text-center md:pt-44 md:pb-14">
        <Reveal>
          <p className="text-[12px] font-semibold tracking-[0.14em] text-[#1e6b3c] uppercase">
            Deals
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl text-[2.2rem] leading-[1.06] font-semibold tracking-[-0.045em] md:text-[3.6rem]">
            Good work, at the price a small business can actually start at.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-[#111111]/65 md:mt-5 md:text-[17px]">
            You don't need the whole thing on day one. Start with the cheapest piece that makes you
            money, and add the rest when it has paid for itself.
          </p>
          <a
            href="/consultation"
            className="mt-6 inline-flex min-h-[48px] items-center rounded-full bg-[#1e6b3c] px-7 text-[15px] font-semibold text-white transition-colors hover:bg-[#111111] md:mt-8"
          >
            Free 20-minute call first →
          </a>
        </Reveal>
      </section>

      {/* the deals */}
      <section className="mx-auto max-w-6xl px-6 pb-8 md:pb-20">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          {DEALS.map((d, i) => (
            <Reveal key={d.title} className="h-full" delay={Math.min(i * 0.05, 0.15)}>
              <article
                className={`flex h-full flex-col rounded-3xl border bg-white p-5 transition-all duration-300 md:p-8 ${
                  d.best
                    ? "border-[#1e6b3c]/40 shadow-[0_30px_70px_-45px_rgba(30,107,60,0.45)]"
                    : "border-black/[0.08] shadow-[0_24px_60px_-50px_rgba(17,17,17,0.35)]"
                }`}
              >
                <div className="flex items-start gap-4">
                  <img
                    src={d.art}
                    alt=""
                    loading="lazy"
                    width={128}
                    height={128}
                    className="h-14 w-14 shrink-0 object-contain md:h-20 md:w-20"
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-[11.5px] font-bold tracking-[0.14em] uppercase ${
                        d.best ? "text-[#1e6b3c]" : "text-[#111111]/40"
                      }`}
                    >
                      {d.eyebrow}
                    </p>
                    <h2 className="mt-1.5 text-[19px] leading-tight font-semibold tracking-[-0.03em] md:text-[24px]">
                      {d.title}
                    </h2>
                  </div>
                </div>

                <p className="mt-4 text-[28px] leading-none font-semibold tracking-[-0.04em] md:mt-5 md:text-[38px]">
                  {d.price}
                  {d.price !== "Ask" && (
                    <span className="ml-1.5 align-middle text-[12px] font-medium tracking-normal text-[#111111]/45">
                      to start
                    </span>
                  )}
                </p>

                <p className="mt-3 text-[14.5px] leading-relaxed text-[#111111]/65 md:text-[15px]">
                  {d.line}
                </p>

                <ul className="mt-4 space-y-1.5 md:mt-5 md:space-y-2">
                  {d.includes.map((it) => (
                    <li
                      key={it}
                      className="flex gap-2.5 text-[13.5px] leading-relaxed text-[#111111]/70 md:text-[14px]"
                    >
                      <span
                        aria-hidden
                        className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#1e6b3c]"
                      />
                      {it}
                    </li>
                  ))}
                </ul>

                <a
                  href={d.href}
                  className={`mt-6 flex min-h-[48px] w-full items-center justify-center rounded-full px-6 text-[15px] font-semibold transition-all duration-300 ${
                    d.best
                      ? "bg-[#1e6b3c] text-white hover:bg-[#111111]"
                      : "border border-[#111111]/15 text-[#111111] hover:border-[#1e6b3c] hover:bg-[#1e6b3c] hover:text-white"
                  }`}
                >
                  {d.cta} →
                </a>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* the honest bit */}
      <section className="border-t border-black/[0.06] bg-[#F5F5F3]">
        <div className="mx-auto max-w-3xl px-6 py-10 text-center md:py-14">
          <Reveal>
            <h2 className="text-2xl font-semibold tracking-[-0.035em] md:text-3xl">
              What "cheap" does and doesn't mean here.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[14.5px] leading-relaxed text-[#111111]/65 md:text-[16px]">
              These are starting prices for a scoped piece of work, not a sale price cut from a
              bigger number. A bigger site or a more involved system costs more, and we tell you the
              figure before anything starts. What doesn't change at this price: the same engineers,
              the same testing, and you own what we build.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <a
                href="/quote"
                className="inline-flex min-h-[48px] items-center rounded-full bg-[#111111] px-7 text-[15px] font-semibold text-white transition-colors hover:bg-[#1e6b3c]"
              >
                Get a quote →
              </a>
              <a
                href="/services"
                className="inline-flex min-h-[48px] items-center rounded-full border border-black/15 px-6 text-[15px] font-semibold text-[#111111] transition-colors hover:border-[#1e6b3c] hover:text-[#1e6b3c]"
              >
                See everything we build
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
