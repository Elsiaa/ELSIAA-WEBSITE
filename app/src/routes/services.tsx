import { useEffect, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "../components/SiteNav";
import { Reveal } from "../components/Reveal";
import { absoluteUrl } from "../lib/site-url";

/*
  Services — the full ELSIAA offering on one page.

  This absorbs the operational-automation work that used to sit on its own
  site. One brand: nothing here is labelled as a separate company or
  division, because it is not one.

  On pricing. Three numbers were already published on /deals and the old
  services page, and they are reused verbatim so the site cannot contradict
  itself: websites $750, one system $1,000, apps $10k. The rest are marked
  "from" and are starting points for a scoped quote, not quotes. They are
  listed in PRICING_TO_CONFIRM below — anything still in that list has NOT
  been confirmed by the business and should be checked before launch.
*/

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — ELSIAA · AI Done Better" },
      {
        name: "description",
        content:
          "Web design from $750, business automation from $1,000, apps from $10k — plus browser automation, custom platforms, dashboards, AI phone agents, and brand. Built and maintained by ELSIAA.",
      },
      { property: "og:title", content: "Services — ELSIAA" },
      {
        property: "og:description",
        content: "Everything ELSIAA builds, with a starting price on each.",
      },
      { property: "og:image", content: absoluteUrl("/assets/og_cover.png") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/services") }],
  }),
  component: ServicesPage,
});

const SANS = "var(--font-sans)";

/** Starting prices not yet confirmed by the business — see the note above. */
export const PRICING_TO_CONFIRM = [
  "Browser Automation",
  "Operational Dashboards",
  "AI Phone & Chat Agents",
  "Custom Platforms",
  "Brand & Social",
];

type Service = {
  name: string;
  from: string;
  line: string;
  points: string[];
  art: string;
  /** true when the figure is already published elsewhere on the site */
  confirmed?: boolean;
};

const SERVICES: Service[] = [
  {
    name: "Web Design",
    from: "$750",
    confirmed: true,
    line: "A site built to convert — designed, written, and shipped live.",
    points: ["Design and copy", "Mobile-first build", "SEO and analytics", "Hosting and updates"],
    art: "web",
  },
  {
    name: "Business Automation",
    from: "$1,000",
    confirmed: true,
    line: "The jobs that still wait on a person, handed to a system that does not sleep.",
    points: [
      "Invoice and document handling",
      "Support triage and routing",
      "Lead enrichment and follow-up",
      "Scheduling and reminders",
    ],
    art: "automation",
  },
  {
    name: "Brand & Social",
    from: "$1,500",
    line: "The identity, and the feed that carries it.",
    points: ["Logo and brand system", "Content and video", "Channel management", "Paid social"],
    art: "brand",
  },
  {
    name: "Browser Automation",
    from: "$2,500",
    line: "For the systems with no API. Our agents drive the screen the way a person would.",
    points: [
      "Legacy portal operation",
      "Document and PDF extraction",
      "Form filling at volume",
      "Cross-system data sync",
    ],
    art: "browser",
  },
  {
    name: "AI Phone & Chat Agents",
    from: "$2,500",
    line: "Answers every call and message, day or night, in your voice.",
    points: [
      "24/7 call answering",
      "Booking and intake",
      "Trained on your policies",
      "Hands off to a human on request",
    ],
    art: "agent",
  },
  {
    name: "Operational Dashboards",
    from: "$3,500",
    line: "Every number the business runs on, in one place, updating itself.",
    points: [
      "Live profitability tracking",
      "Automated reporting",
      "Multi-source aggregation",
      "Alerts on the numbers that matter",
    ],
    art: "dashboard",
  },
  {
    name: "Mobile Apps",
    from: "$10k",
    confirmed: true,
    line: "iOS and Android products, built properly and released to the stores.",
    points: [
      "Native iOS and Android",
      "Offline-first where it matters",
      "Field and client apps",
      "Store submission handled",
    ],
    art: "apps",
  },
  {
    name: "Custom Platforms",
    from: "$12k",
    line: "Bespoke internal software — portals, dashboards, and the logic underneath.",
    points: [
      "Internal operations portals",
      "Client-facing gateways",
      "Custom business logic",
      "Built to own, not to licence",
    ],
    art: "platform",
  },
];

/* How the work actually runs, start to finish. */
const PROCESS: Array<[string, string]> = [
  ["Audit", "We map where the time and money actually go. Free, and yours to keep."],
  ["Scope", "A fixed scope and a fixed price. You approve before anything is built."],
  ["Build", "Engineered, tested, and shown to you working — not as a mockup."],
  ["Deploy", "Rolled into your operation without stopping it, then maintained."],
];


/*
  Card art. The still is the poster and paints instantly; the loop takes over
  once it can play, so a slow connection still gets a sharp image rather than
  an empty box.

  The clips keep playing rather than pausing off-screen — the same watchdog the
  division graphics use, because browsers stop muted autoplay on tab-switch and
  under memory pressure and nothing restarts it. Reduced motion holds the still.
*/
function ServiceArt({ name }: { name: string }) {
  const ref = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      v.pause();
      return;
    }
    const resume = () => {
      if (v.paused) v.play().catch(() => {});
    };
    resume();
    v.addEventListener("pause", resume);
    document.addEventListener("visibilitychange", resume);
    const t = setInterval(resume, 4000);
    return () => {
      v.removeEventListener("pause", resume);
      document.removeEventListener("visibilitychange", resume);
      clearInterval(t);
    };
  }, []);
  return (
    <div className="relative h-full w-full bg-white">
      <video
        ref={ref}
        src={`/assets/services/${name}.mp4`}
        poster={`/assets/services/${name}.png`}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden
        /*
          multiply is what actually makes these sit on white. The renders are
          near-white, but h.264 in yuv420p cannot hold an exact 255 across a
          frame — chroma subsampling and the YUV round trip leave the border
          around 239-253, which reads as a faint grey panel on a white card.
          Snapping levels before encoding narrowed it but could not close it.
          Under multiply, white is the identity: anything at or near white
          disappears into the card and only the subject darkens.
        */
        style={{ mixBlendMode: "multiply" }}
        className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.03]"
      />
      {/* dissolves the last few pixels of every edge, so no frame boundary
          survives even at the corners */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, #fff, rgba(255,255,255,0) 6%, rgba(255,255,255,0) 94%, #fff), linear-gradient(to bottom, #fff, rgba(255,255,255,0) 6%, rgba(255,255,255,0) 94%, #fff)",
        }}
      />
    </div>
  );
}


/*
  Category marks — the same isometric clay language as the service art, sized
  down to sit beside a heading. multiply because the renders ground out around
  245-255 rather than a flat white, which would otherwise show as a pale square
  against the card.
*/
const CAT_ART: Record<string, string> = {
  "Back office": "backoffice",
  Customer: "customer",
  Growth: "growth",
  Documents: "documents",
  Decisions: "decisions",
  Execution: "execution",
};

function CatIcon({ kind }: { kind: string }) {
  const file = CAT_ART[kind] ?? "execution";
  return (
    <img
      src={`/assets/services/cat/${file}.png`}
      alt=""
      aria-hidden
      width={160}
      height={160}
      loading="lazy"
      style={{ mixBlendMode: "multiply" }}
      className="h-9 w-9 flex-none object-contain"
    />
  );
}

function ServicesPage() {
  return (
    <main className="min-h-screen bg-white text-[#111111]" style={{ fontFamily: SANS }}>
      <SiteNav />

      {/* hero */}
      <section className="mx-auto max-w-6xl px-6 pt-28 pb-8 text-center md:pt-44 md:pb-12">
        <Reveal>
          <p className="text-[13px] font-semibold text-[#1e6b3c]">Services</p>
          <h1 className="mx-auto mt-2 max-w-3xl text-4xl font-semibold leading-[1.04] tracking-[-0.045em] md:text-7xl">
            Everything we build, with a price on it.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-[#111111]/60 md:text-[17px]">
            Fixed scope, fixed price, and you own the finished system. Start anywhere on this
            page — the first twenty minutes are free.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/quote"
              className="inline-flex min-h-[48px] items-center rounded-full bg-[#1e6b3c] px-8 text-[14px] font-bold text-white transition-all hover:bg-[#111111]"
            >
              Get a quote →
            </a>
            <a
              href="/contact"
              className="inline-flex min-h-[48px] items-center rounded-full border border-black/15 px-8 text-[14px] font-bold text-[#111111] transition-all hover:border-[#1e6b3c] hover:text-[#1e6b3c]"
            >
              Book a free 20-min call
            </a>
          </div>
        </Reveal>
      </section>

      {/* the catalogue */}
      <section className="bg-[#F5F5F3] px-6 py-10 md:py-16">
        <div className="mx-auto max-w-6xl">
          <div /* four across: eight cards land as two clean rows instead of the
               ragged 3+3+2 a three-column grid gives */
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {SERVICES.map((s, i) => (
              <Reveal key={s.name} delay={Math.min(i * 0.04, 0.2)} className="h-full">
                <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-black/[0.07] bg-white transition-all duration-300 hover:-translate-y-1 hover:border-[#1e6b3c]/35 hover:shadow-[0_30px_70px_-45px_rgba(17,17,17,0.35)]">
                  <div className="aspect-[4/3] w-full overflow-hidden bg-white">
                    <ServiceArt name={s.art} />
                  </div>
                  <div className="flex flex-1 flex-col p-5 md:p-6">
                    <div className="flex items-baseline justify-between gap-3">
                      <h2 className="text-[18px] font-semibold tracking-[-0.02em] md:text-[19px]">
                        {s.name}
                      </h2>
                      <span className="shrink-0 text-[14px] font-semibold text-[#1e6b3c]">
                        from {s.from}
                      </span>
                    </div>
                    <p className="mt-2 text-[13.5px] leading-relaxed text-[#111111]/60">{s.line}</p>
                    <ul className="mt-4 space-y-1.5 border-t border-black/[0.06] pt-4">
                      {s.points.map((p) => (
                        <li
                          key={p}
                          className="flex items-start gap-2 text-[13px] leading-snug text-[#111111]/65"
                        >
                          <span className="mt-[7px] h-[4px] w-[4px] shrink-0 rotate-45 bg-[#1e6b3c]/60" />
                          {p}
                        </li>
                      ))}
                    </ul>
                    <a
                      href={`/quote?service=${encodeURIComponent(s.name)}`}
                      className="mt-auto inline-flex min-h-[44px] items-center pt-4 text-[13px] font-semibold text-[#1e6b3c] transition-colors hover:text-[#111111]"
                    >
                      Get a price →
                    </a>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-[13px] leading-relaxed text-[#111111]/45">
            Starting prices for a scoped build. Every project is quoted on what it actually needs,
            and the number you approve is the number you pay.
          </p>
        </div>
      </section>

      {/* what we automate — the breadth, stated plainly */}
      <section className="px-6 py-10 md:py-16">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <h2 className="text-center text-[1.5rem] font-semibold tracking-[-0.035em] md:text-[2.2rem]">
              If it happens on a screen, we can automate it.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-[14px] leading-relaxed text-[#111111]/55 md:text-[15px]">
              Including the systems that have no API. Where other shops stop, we drive the browser.
            </p>
          </Reveal>
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {[
              ["Back office", "backoffice", ["Invoices", "Payroll prep", "Data migration", "Audits"]],
              ["Customer", "customer", ["Support triage", "Returns", "Onboarding", "CRM updates"]],
              ["Growth", "growth", ["Lead enrichment", "Outreach", "Proposals", "Competitor tracking"]],
              ["Documents", "documents", ["PDF parsing", "OCR", "Scraping", "Unstructured entry"]],
              ["Decisions", "decisions", ["Fraud checks", "QA", "Eligibility", "Triage"]],
              ["Execution", "execution", ["Browsers", "Email", "Scheduling", "Workflows"]],
            ].map(([title, icon, items], i) => (
              <Reveal key={title as string} delay={Math.min(i * 0.04, 0.2)} className="h-full">
                <div className="h-full rounded-xl border border-black/[0.07] bg-white p-4">
                  <p className="flex items-center gap-2 text-[12px] font-semibold tracking-[0.06em] text-[#1e6b3c] uppercase">
                    <CatIcon kind={title as string} />
                    {title as string}
                  </p>
                  <ul className="mt-2.5 space-y-1">
                    {(items as string[]).map((it) => (
                      <li key={it} className="text-[12.5px] leading-snug text-[#111111]/60">
                        {it}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* how it runs */}
      <section className="bg-[#F5F5F3] px-6 py-10 md:py-16">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <h2 className="text-center text-[1.5rem] font-semibold tracking-[-0.035em] md:text-[2.2rem]">
              How the work runs.
            </h2>
          </Reveal>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map(([title, line], i) => (
              <Reveal key={title} delay={Math.min(i * 0.05, 0.2)} className="h-full">
                <div className="h-full rounded-2xl border border-black/[0.07] bg-white p-5 md:p-6">
                  {/* no step numbers — the order is already the reading order */}
                  <h3 className="text-[17px] font-semibold tracking-[-0.02em]">{title}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-[#111111]/60">{line}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* close */}
      <section className="px-6 pb-12 pt-10 text-center md:pb-20 md:pt-16">
        <Reveal>
          <h2 className="mx-auto max-w-2xl text-[1.5rem] font-semibold tracking-[-0.035em] md:text-[2.2rem]">
            Tell us the part of the business that still waits on a person.
          </h2>
          <p className="mt-3 text-[14px] text-[#111111]/60">
            Fully insured · Fixed scope · You own the finished system.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/quote"
              className="inline-flex min-h-[48px] items-center rounded-full bg-[#1e6b3c] px-9 text-[14px] font-bold text-white transition-all hover:bg-[#111111]"
            >
              Get a quote →
            </a>
            <a
              href="tel:+18889155531"
              className="inline-flex min-h-[48px] items-center rounded-full border border-black/15 px-9 text-[14px] font-bold text-[#111111] transition-all hover:border-[#1e6b3c] hover:text-[#1e6b3c]"
            >
              Call 1-888-915-5531
            </a>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
