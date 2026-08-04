import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteNav } from "../components/SiteNav";
import { ScrollGlobe, CountTo } from "../components/ScrollGlobe";
import { Reveal } from "../components/Reveal";
import { absoluteUrl } from "../lib/site-url";

export const Route = createFileRoute("/locations")({
  head: () => ({
    meta: [
      { title: "Locations — ELSIAA · AI Done Better" },
      {
        name: "description",
        content:
          "ELSIAA has clients and its own people on the ground in New York, Los Angeles, London, Geneva, Antwerp, and Tel Aviv — fully insured, by appointment, and able to deploy anywhere in the world. 24/7 virtual support.",
      },
      { property: "og:title", content: "Locations — ELSIAA" },
      { property: "og:image", content: absoluteUrl("/assets/og_cover.png") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/locations") }],
  }),
  component: LocationsPage,
});

const sans = {
  fontFamily:
    "var(--font-sans)",
} as const;

type Office = {
  name: string;
  short: string;
  country: string;
  flag: string;
  tz: string;
  tzLabel: string;
  art: string;
  hq?: boolean;
  /* Contact details. Left empty where we do not have a verified value — the
     card simply omits the row rather than showing an invented address or a
     placeholder phone number. Fill these in and they appear. */
  address?: string;
  phone?: string;
  email?: string;
  // approximate longitude for the follow-the-sun strip (−180…180)
  lon: number;
};

/* Shown until a verified street address exists for that city. Deliberately
   reads as a blank to fill, never as an address, so it cannot ship as one. */
const ADDRESS_TBC = "Street address to be confirmed";

const OFFICES: Office[] = [
  {
    name: "New York",
    short: "New York",
    country: "United States",
    flag: "us",
    tz: "America/New_York",
    tzLabel: "Eastern",
    art: "/assets/cityart/nyc.jpg",
    hq: true,
    lon: -74,
  },
  {
    name: "London",
    short: "London",
    country: "United Kingdom",
    flag: "gb",
    tz: "Europe/London",
    tzLabel: "Greenwich",
    art: "/assets/cityart/london.jpg",
    lon: 0,
  },
  {
    name: "Geneva",
    short: "Geneva",
    country: "Switzerland",
    flag: "ch",
    tz: "Europe/Zurich",
    tzLabel: "Central European",
    art: "/assets/cityart/geneva.jpg",
    lon: 6,
  },
  {
    name: "Antwerp",
    short: "Antwerp",
    country: "Belgium",
    flag: "be",
    tz: "Europe/Brussels",
    tzLabel: "Central European",
    art: "/assets/cityart/antwerp.jpg",
    lon: 4,
  },
  {
    name: "Tel Aviv",
    short: "Tel Aviv",
    country: "Israel",
    flag: "il",
    tz: "Asia/Jerusalem",
    tzLabel: "Israel",
    art: "/assets/cityart/telaviv.jpg",
    lon: 35,
  },
  {
    name: "Los Angeles",
    short: "Los Angeles",
    country: "United States",
    flag: "us",
    tz: "America/Los_Angeles",
    tzLabel: "Pacific",
    art: "/assets/cityart/la.jpg",
    lon: -118,
  },
];

const REGIONS = [
  { region: "Americas", cities: [OFFICES[0], OFFICES[5]] },
  { region: "Europe", cities: [OFFICES[1], OFFICES[2], OFFICES[3]] },
  { region: "Middle East", cities: [OFFICES[4]] },
];

// Regional U.S. offices with public street addresses (all Eastern time).
const US_OFFICES: Array<{ city: string; state: string; address: string; tz: string }> = [
  { city: "Baltimore", state: "Maryland", address: "2901 Fallstaff Rd, Suite 304", tz: "America/New_York" },
  { city: "Montvale", state: "New Jersey", address: "50 Chestnut Ridge Rd, Suite 130", tz: "America/New_York" },
  { city: "Hackensack", state: "New Jersey", address: "1 University Plaza", tz: "America/New_York" },
  { city: "Kingston", state: "Pennsylvania", address: "150 James St", tz: "America/New_York" },
];

/* Seed the clock on the client so the first client paint already shows real
   times — no "--:--" flash. SSR renders null (a clean em-dash, not a broken
   digital placeholder); suppressHydrationWarning keeps the console quiet. */
function useNow() {
  const [now, setNow] = useState<Date | null>(() =>
    typeof window === "undefined" ? null : new Date(),
  );
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function fmtTime(now: Date | null, tz: string) {
  if (!now) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: tz,
  }).format(now);
}

function fmtOffset(now: Date | null, tz: string, fallback: string) {
  if (!now) return fallback;
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    }).formatToParts(now);
    const off = parts.find((p) => p.type === "timeZoneName")?.value;
    return off ? off.replace("GMT", "UTC") : fallback;
  } catch {
    return fallback;
  }
}

/* live local time — suppressHydrationWarning so the seeded client time can
   differ from the SSR em-dash without a console warning. */
function LiveTime({ now, tz, className }: { now: Date | null; tz: string; className?: string }) {
  return (
    <span suppressHydrationWarning className={className} style={sans}>
      {fmtTime(now, tz)}
    </span>
  );
}

function LocationsPage() {
  const now = useNow();

  return (
    <main className="min-h-screen bg-white text-[#111111]" style={sans}>
      <SiteNav />

      {/* ── hero — dual-presence message left, live globe anchor right ── */}
      <section className="mx-auto max-w-6xl px-6 pt-28 pb-10 md:pt-40 md:pb-16">
        <div className="grid grid-cols-1 items-center gap-7 md:gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:gap-16">
          <Reveal>
            <p className="text-[13px] font-semibold text-[#1e6b3c]">Where we work</p>
            <h1 className="mt-4 text-[2.6rem] font-semibold leading-[1.03] tracking-[-0.045em] md:text-[4.1rem]">
              Six cities.
              <br />
              Our own people in each.
            </h1>
            <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-[#111111]/65 md:text-[17px]">
              New York, Los Angeles, London, Geneva, Antwerp and Tel Aviv. Each one has
              ELSIAA clients and ELSIAA staff you can sit down with, by appointment. If
              you are somewhere else, we work your hours remotely and fly out when the
              job needs someone in the room.
            </p>
            
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mx-auto flex w-[220px] flex-col items-center sm:w-[300px] lg:w-full">
              <ScrollGlobe size={460} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── proof bar ── */}
 <section className="">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 gap-y-8 py-10 md:grid-cols-4 md:py-12">
            {[
              { n: 6, s: "", label: "Cities on the ground" },
              { n: 3, s: "", label: "Continents active" },
              { n: 24, s: "/7", label: "Virtual support, every day" },
              { n: 100, s: "%", label: "Fully insured work" },
            ].map((st) => (
              <div key={st.label} className="text-center">
                <p className="text-4xl font-semibold tracking-[-0.04em] md:text-5xl">
                  <CountTo target={st.n} suffix={st.s} />
                </p>
                <p className="mt-2 text-[13px] text-[#111111]/55">{st.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── the directory — the clearest statement of the dual presence ── */}
      <section className="mx-auto max-w-6xl px-6 py-10 md:py-16">
        <Reveal>
          <h2 className="max-w-3xl text-3xl font-semibold tracking-[-0.04em] md:text-5xl">
            Our offices
          </h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#111111]/60 md:text-[16px]">
            Local time is live. Visits are by appointment.
          </p>
        </Reveal>

        <div className="mt-9 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {OFFICES.map((o, i) => (
            <Reveal key={o.name} delay={(i % 3) * 0.05}>
              <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-black/[0.07] bg-white transition-all duration-300 hover:-translate-y-1 hover:border-[#1e6b3c]/35 hover:shadow-[0_30px_70px_-45px_rgba(17,17,17,0.35)]">
                {/* city art header */}
                <div className="relative h-[168px] overflow-hidden bg-white">
                  <img
                    src={o.art}
                    alt={`${o.name} skyline`}
                    loading="lazy"
                    className="h-full w-full object-cover object-bottom transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                  <span className="absolute top-4 right-4 flex items-center gap-2 rounded-full border border-black/[0.08] bg-white/85 px-3.5 py-1.5 text-[13px] font-medium tabular-nums backdrop-blur">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#1e6b3c]" />
                    <LiveTime now={now} tz={o.tz} />
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-5 md:p-6">
                  <h3 className="flex items-center gap-2.5 text-[19px] font-semibold tracking-[-0.02em]">
                    <img
                      src={`/assets/flags/${o.flag}.png`}
                      srcSet={`/assets/flags/${o.flag}@2x.png 2x`}
                      alt=""
                      className="h-[13px] w-[19px] rounded-[2px] object-cover ring-1 ring-black/10"
                    />
                    {o.name}
                    {o.hq && (
                      <span className="rounded-full bg-[#1e6b3c]/10 px-2 py-0.5 text-[12px] font-semibold text-[#1e6b3c]">
                        HQ
                      </span>
                    )}
                  </h3>
                  <p className="mt-1.5 text-[13.5px] text-[#111111]/55">
                    {o.country} · {fmtOffset(now, o.tz, o.tzLabel)}
                  </p>

                  <div className="mt-4 space-y-1.5 border-t border-black/[0.06] pt-4 text-[13.5px] text-[#111111]/70">
                    <p className={o.address ? "" : "text-[#111111]/35 italic"}>
                      {o.address ?? ADDRESS_TBC}
                    </p>
                    {o.phone ? (
                      <p>
                        <a href={`tel:${o.phone.replace(/[^+\d]/g, "")}`} className="transition-colors hover:text-[#1e6b3c]">
                          {o.phone}
                        </a>
                      </p>
                    ) : (
                      <p className="text-[#111111]/35 italic">Phone number to be confirmed</p>
                    )}
                    <p>
                      <a href={`mailto:${o.email ?? "info@elsiaa.com"}`} className="transition-colors hover:text-[#1e6b3c]">
                        {o.email ?? "info@elsiaa.com"}
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── U.S. offices — the regional footprint, with public addresses ── */}
 <section className="bg-[#F5F5F3] px-6 py-10 md:py-16">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="text-[13px] font-semibold text-[#1e6b3c]">U.S. offices</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.04em] md:text-5xl">
              And a regional footprint across the U.S.
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[#111111]/60 md:text-[16px]">
              Beyond the flagship cities, working offices you can visit by appointment —
              real addresses, an ELSIAA team at each.
            </p>
          </Reveal>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {US_OFFICES.map((o, i) => (
              <Reveal key={o.address} delay={(i % 3) * 0.05}>
                <div className="group flex h-full flex-col rounded-2xl border border-black/[0.08] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#1e6b3c]/35 hover:shadow-[0_30px_70px_-45px_rgba(17,17,17,0.35)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="flex items-center gap-2.5 whitespace-nowrap text-[19px] font-semibold tracking-[-0.02em]">
                        <img
                          src="/assets/flags/us.png"
                          srcSet="/assets/flags/us@2x.png 2x"
                          alt=""
                          className="h-[13px] w-[19px] rounded-[2px] object-cover ring-1 ring-black/10"
                        />
                        {o.city}
                      </h3>
                      <p className="mt-1.5 text-[13px] text-[#111111]/45">
                        {o.state} · <LiveTime now={now} tz={o.tz} /> local
                      </p>
                    </div>
                    <span className="mt-1 text-[#1e6b3c]" aria-hidden>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M12 21s7-6.5 7-11a7 7 0 10-14 0c0 4.5 7 11 7 11z" />
                        <circle cx="12" cy="10" r="2.5" />
                      </svg>
                    </span>
                  </div>

                  <p className="mt-4 text-[14px] leading-relaxed text-[#111111]/70">{o.address}</p>

                  <div className="mt-auto space-y-2 border-t border-black/[0.06] pt-5">
                    <p className="flex items-center gap-2 text-[13px] font-medium text-[#111111]/80">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#1e6b3c]" />
                      On-site team — visit by appointment
                    </p>
                    <a
                      href="/contact"
                      className="inline-block pt-1 text-[13px] font-medium text-[#1e6b3c] transition-colors hover:text-[#111111]"
                    >
                      Book a visit →
                    </a>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── follow the sun — one clean coverage strip, full city names ── */}
 <section className="bg-[#F5F5F3]">
        <div className="mx-auto max-w-6xl px-6 py-10 md:py-16">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] md:items-center md:gap-16">
            <Reveal>
              <p className="text-[13px] font-semibold text-[#1e6b3c]">Time zones</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] md:text-5xl">
                Someone is working at any hour.
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#111111]/60">
                From Tel Aviv opening the day to Los Angeles closing it, our six cities
                cover the clock end to end. Something urgent at 3 a.m. your time is
                business hours for one of our desks — so it gets answered.
              </p>
              {/* the regional ledger, compact */}
              <div className="mt-8 space-y-4">
                {REGIONS.map((r) => (
                  <div key={r.region} className="border-t border-black/[0.08] pt-3 first:border-0 first:pt-0">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#111111]/40">
                      {r.region}
                    </p>
                    <div className="mt-2 space-y-1.5">
                      {r.cities.map((c) => (
                        <div key={c.name} className="flex items-baseline justify-between gap-6">
                          <span className="flex items-center gap-2.5 whitespace-nowrap text-[15px] font-medium tracking-[-0.01em]">
                            <img
                              src={`/assets/flags/${c.flag}.png`}
                              srcSet={`/assets/flags/${c.flag}@2x.png 2x`}
                              alt=""
                              className="h-[12px] w-[18px] rounded-[2px] object-cover ring-1 ring-black/10"
                            />
                            {c.name}
                          </span>
                          <LiveTime now={now} tz={c.tz} className="text-[14px] tabular-nums text-[#111111]/55" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <CoverageArc now={now} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── anywhere in the world ── */}
      <section className="mx-auto max-w-6xl px-6 py-10 md:py-16">
        <Reveal>
          <p className="text-[13px] font-semibold text-[#1e6b3c]">Anywhere in the world</p>
          <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.04em] md:text-5xl">
            Working outside these cities
          </h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[#111111]/60 md:text-[16px]">
            Our people deploy and work anywhere on earth. If your business is outside these
            six cities, we come to you — on-site when it matters, and fully remote the rest
            of the time, in your timezone, around the clock.
          </p>
        </Reveal>
      </section>

      {/* ── insured strip ── */}
 <section className="bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-3 px-6 py-10 md:flex-row md:items-center md:justify-between">
          <p className="flex items-center gap-3 text-[15px] font-medium text-[#111111]/80">
            <span className="inline-block h-2 w-2 rounded-full bg-[#1e6b3c]" />
            Every engagement is fully insured — the same standard in all six cities and
            anywhere we travel.
          </p>
          <a href="/clients" className="text-[13px] font-medium text-[#1e6b3c] hover:underline">
            How we work ↗
          </a>
        </div>
      </section>

      {/* ── closing ── */}
 <section className="mx-auto max-w-6xl px-6 py-9 text-center md:py-16">
        <Reveal>
          <h2 className="mx-auto max-w-3xl text-3xl font-semibold tracking-[-0.035em] md:text-5xl">
            Tell us where you are. We'll be there — or already awake for you.
          </h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/contact"
              className="inline-flex min-h-[52px] items-center rounded-full bg-[#111111] px-8 text-[15px] font-semibold text-white transition-colors duration-300 hover:bg-[#1e6b3c]"
            >
              Book a call →
            </a>
            <a
              href="/contact"
              className="inline-flex min-h-[52px] items-center rounded-full border border-[#111111]/20 px-8 text-[15px] font-semibold text-[#111111] transition-colors duration-300 hover:border-[#1e6b3c] hover:text-[#1e6b3c]"
            >
              Request on-site support
            </a>
          </div>
        </Reveal>
      </section>
    </main>
  );
}

/*
  Follow-the-sun strip — a restrained emerald hairline arc with the six cities
  evenly spaced west→east, live local time under each, and the sun's approximate
  position marked from the current UTC hour. Pure inline SVG; SSR-safe.
*/
function CoverageArc({ now }: { now: Date | null }) {
  const W = 1000;
  const H = 210;
  const padX = 60;
  const baseY = 150;
  const arcTop = 46;
  const xFor = (lon: number) => padX + ((lon + 180) / 360) * (W - padX * 2);

  // evenly spaced west→east so clustered European offices never collide
  const sorted = [...OFFICES].sort((a, b) => a.lon - b.lon);
  const cityX = (i: number) => padX + (i / (sorted.length - 1)) * (W - padX * 2);

  // sun x from current UTC time (subsolar longitude ≈ 180 − 15 · UTCHours)
  const sunLon = now
    ? ((180 - 15 * (now.getUTCHours() + now.getUTCMinutes() / 60) + 540) % 360) - 180
    : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white p-4 md:p-8">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Timezone coverage across six cities">
        {/* baseline */}
        <line x1={padX} y1={baseY} x2={W - padX} y2={baseY} stroke="#1e6b3c" strokeOpacity="0.25" strokeWidth="1" />

        {/* daylight arc */}
        <path
          d={`M ${padX} ${baseY} Q ${W / 2} ${arcTop} ${W - padX} ${baseY}`}
          fill="none"
          stroke="#1e6b3c"
          strokeOpacity="0.35"
          strokeWidth="1.25"
        />

        {/* faint hour ticks */}
        {Array.from({ length: 25 }).map((_, i) => {
          const x = padX + (i / 24) * (W - padX * 2);
          return <line key={i} x1={x} y1={baseY} x2={x} y2={baseY + 7} stroke="#111111" strokeOpacity="0.1" strokeWidth="1" />;
        })}

        {/* sun marker */}
        {sunLon !== null && (
          <g>
            <line x1={xFor(sunLon)} y1={arcTop + 8} x2={xFor(sunLon)} y2={baseY} stroke="#1e6b3c" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="2 4" />
            <circle cx={xFor(sunLon)} cy={arcTop + 8} r="6" fill="#1e6b3c" fillOpacity="0.12" />
            <circle cx={xFor(sunLon)} cy={arcTop + 8} r="2.5" fill="#1e6b3c" />
          </g>
        )}

        {/* cities */}
        {sorted.map((o, i) => {
          const x = cityX(i);
          return (
            <g key={o.name}>
              <line x1={x} y1={baseY - 5} x2={x} y2={baseY + 5} stroke="#1e6b3c" strokeWidth="1.5" />
              <circle cx={x} cy={baseY} r="3.5" fill="#fff" stroke="#1e6b3c" strokeWidth="1.5" />
              <text x={x} y={baseY + 28} textAnchor="middle" fontSize="14" fontWeight="600" fill="#111111" fillOpacity="0.7" style={sans} suppressHydrationWarning>
                {fmtTime(now, o.tz)}
              </text>
              <text x={x} y={baseY + 47} textAnchor="middle" fontSize="12" fill="#111111" fillOpacity="0.45" style={sans}>
                {o.short}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
