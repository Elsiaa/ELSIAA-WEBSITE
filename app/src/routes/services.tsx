import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "../components/SiteNav";
import { Reveal } from "../components/Reveal";
import { absoluteUrl } from "../lib/site-url";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — ELSIAA · AI Done Better" },
      {
        name: "description",
        content:
          "Websites from $750. Apps from $10k. Backend software from $1,000. Built, secured, and fully insured by ELSIAA.",
      },
      { property: "og:title", content: "Services — ELSIAA" },
      {
        property: "og:description",
        content: "Websites from $750 · Apps from $10k · Backend software from $1,000.",
      },
      { property: "og:image", content: absoluteUrl("/assets/og_cover.png") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/services") }],
  }),
  component: ServicesPage,
});

const SANS =
  "var(--font-sans)";

type Service = {
  name: string;
  from: string;
  line: string;
  art: "web" | "app" | "backend";
};

const SERVICES: Service[] = [
  {
    name: "Websites",
    from: "$750",
    line: "A site built to convert — designed, written, and shipped live.",
    art: "web",
  },
  {
    name: "Apps",
    from: "$10k",
    line: "iOS and Android products, built properly and released to the stores.",
    art: "app",
  },
  {
    name: "Backend Software",
    from: "$1,000",
    line: "The systems that run the business — automation, portals, integrations.",
    art: "backend",
  },
];

function Art({ kind }: { kind: Service["art"] }) {
  const p = {
    width: 40,
    height: 40,
    viewBox: "0 0 40 40",
    fill: "none",
    stroke: "#1e6b3c",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (kind === "web") {
    return (
      <svg {...p} aria-hidden>
        <rect x="5" y="8" width="30" height="22" rx="3" />
        <line x1="5" y1="14" x2="35" y2="14" />
        <circle cx="9" cy="11" r="1" fill="#1e6b3c" stroke="none" />
        <line x1="10" y1="20" x2="22" y2="20" />
        <line x1="10" y1="25" x2="18" y2="25" />
      </svg>
    );
  }
  if (kind === "app") {
    return (
      <svg {...p} aria-hidden>
        <rect x="13" y="5" width="14" height="30" rx="3" />
        <line x1="18" y1="31" x2="22" y2="31" />
        <line x1="13" y1="10" x2="27" y2="10" />
      </svg>
    );
  }
  return (
    <svg {...p} aria-hidden>
      <ellipse cx="20" cy="11" rx="12" ry="4" />
      <path d="M8 11v8c0 2.2 5.4 4 12 4s12-1.8 12-4v-8" />
      <path d="M8 19v8c0 2.2 5.4 4 12 4s12-1.8 12-4v-8" />
    </svg>
  );
}

function ServicesPage() {
  return (
    <main className="min-h-screen bg-white text-[#111111]" style={{ fontFamily: SANS }}>
      <SiteNav />

      {/* hero */}
      <section className="mx-auto max-w-6xl px-6 pt-36 pb-8 text-center md:pt-44 md:pb-16">
        <Reveal>
          <h1 className="text-5xl font-semibold tracking-[-0.045em] md:text-7xl">Services</h1>
          <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-[#111111]/55 md:text-[17px]">
            Built, secured, and fully insured. One team from the first sketch to the
            software running your business.
          </p>
        </Reveal>
      </section>

      {/* the three offers */}
      <section className="mx-auto max-w-6xl px-6 pb-10 md:pb-20">
        <Reveal delay={0.06}>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
            {SERVICES.map((s) => (
              <a
                key={s.name}
                href="/quote"
                className="group flex flex-col rounded-3xl border border-black/[0.08] bg-white p-8 shadow-[0_24px_60px_-50px_rgba(17,17,17,0.4)] transition-all duration-300 hover:-translate-y-1 hover:border-[#1e6b3c]/35 hover:shadow-[0_30px_70px_-45px_rgba(30,107,60,0.4)]"
              >
                <Art kind={s.art} />
                <h2 className="mt-6 text-[22px] font-semibold tracking-[-0.03em] md:text-[24px]">
                  {s.name}
                </h2>
                <p className="mt-4 text-[13px] font-medium tracking-[0.08em] text-[#111111]/40 uppercase">
                  Starting at
                </p>
                <p className="mt-1 text-[38px] font-semibold leading-none tracking-[-0.04em] md:text-[44px]">
                  {s.from}
                </p>
                <p className="mt-5 mb-8 text-[15px] leading-relaxed text-[#111111]/60">{s.line}</p>
                <span className="mt-auto inline-flex items-center gap-2 text-[15px] font-semibold text-[#1e6b3c] transition-colors group-hover:text-[#111111]">
                  Get a quote
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </span>
              </a>
            ))}
          </div>
        </Reveal>
      </section>

      {/* the standard */}
      <section className="border-t border-black/[0.06] bg-[#F5F5F3]">
        <div className="mx-auto max-w-6xl px-6 py-9 text-center md:py-16">
          <Reveal>
            <p className="mx-auto max-w-2xl text-[17px] leading-relaxed text-[#111111]/70 md:text-[19px]">
              Every build is tested, maintained, and{" "}
              <span className="font-semibold text-[#111111]">fully insured</span> — and you own
              the finished system.
            </p>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-10 text-center md:py-16">
        <Reveal>
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-[-0.035em] md:text-5xl">
            Tell us what you need built.
          </h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/quote"
              className="inline-flex min-h-[54px] items-center rounded-full bg-[#1e6b3c] px-9 text-[15px] font-semibold text-white transition-colors duration-300 hover:bg-[#111111]"
            >
              Get a quote →
            </a>
            <a
              href="/consultation"
              className="inline-flex min-h-[54px] items-center rounded-full border border-black/15 px-8 text-[15px] font-semibold text-[#111111] transition-colors duration-300 hover:border-[#1e6b3c] hover:text-[#1e6b3c]"
            >
              Free 20-minute call
            </a>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
