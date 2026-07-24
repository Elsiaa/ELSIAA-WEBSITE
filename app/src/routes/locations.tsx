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
          "ELSIAA has people on the ground in New York, Los Angeles, London, Geneva, Antwerp, and Tel Aviv — fully insured, by appointment, and able to deploy anywhere in the world. 24/7 virtual support.",
      },
      { property: "og:title", content: "Locations — ELSIAA" },
      { property: "og:image", content: absoluteUrl("/assets/og_cover.png") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/locations") }],
  }),
  component: LocationsPage,
});

const mono = { fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" } as const;
const inter = { fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" } as const;

type Office = {
  name: string;
  country: string;
  flag: string;
  tz: string;
  tzLabel: string;
  art: string;
  role: string;
  hq?: boolean;
  lead: string;
  line: string;
  focus: string[];
  // approximate longitude for the follow-the-sun strip (−180…180)
  lon: number;
};

const OFFICES: Office[] = [
  {
    name: "New York City",
    country: "United States",
    flag: "us",
    tz: "America/New_York",
    tzLabel: "Eastern",
    art: "/assets/cityart/nyc.jpg",
    role: "Headquarters & delivery",
    hq: true,
    lead: "Global Managing Partner",
    line: "Where the standard is set. Program delivery and client strategy for the Americas.",
    focus: ["Program delivery", "Client strategy"],
    lon: -74,
  },
  {
    name: "London",
    country: "United Kingdom",
    flag: "gb",
    tz: "Europe/London",
    tzLabel: "Greenwich",
    art: "/assets/cityart/london.jpg",
    role: "Client & partnerships",
    lead: "Head of EMEA Partnerships",
    line: "The European front door — where new relationships and account leadership begin.",
    focus: ["Partnerships", "Account leadership"],
    lon: 0,
  },
  {
    name: "Geneva",
    country: "Switzerland",
    flag: "ch",
    tz: "Europe/Zurich",
    tzLabel: "Central European",
    art: "/assets/cityart/geneva.jpg",
    role: "Continental European desk",
    lead: "Principal, Continental Europe",
    line: "Precision work for precision clients. Governance and discretion by default.",
    focus: ["Governance", "Private clients"],
    lon: 6,
  },
  {
    name: "Antwerp",
    country: "Belgium",
    flag: "be",
    tz: "Europe/Brussels",
    tzLabel: "Central European",
    art: "/assets/cityart/antwerp.jpg",
    role: "Benelux delivery desk",
    lead: "Delivery Lead, Benelux",
    line: "The Benelux desk — hands-on delivery operations and localisation across the region.",
    focus: ["Delivery ops", "Localisation"],
    lon: 4,
  },
  {
    name: "Tel Aviv",
    country: "Israel",
    flag: "il",
    tz: "Asia/Jerusalem",
    tzLabel: "Israel",
    art: "/assets/cityart/telaviv.jpg",
    role: "AI & engineering",
    lead: "Head of Engineering",
    line: "The engine room. Applied research, model work and platform engineering.",
    focus: ["Applied research", "Platform engineering"],
    lon: 35,
  },
  {
    name: "Los Angeles",
    country: "United States",
    flag: "us",
    tz: "America/Los_Angeles",
    tzLabel: "Pacific",
    art: "/assets/cityart/la.jpg",
    role: "West Coast desk",
    lead: "Principal, West Coast",
    line: "The West Coast chapter — design, media and entertainment work close to its clients.",
    focus: ["Design", "Media & entertainment"],
    lon: -118,
  },
];

const REGIONS = [
  { region: "Americas", cities: [OFFICES[0], OFFICES[5]] },
  { region: "Europe", cities: [OFFICES[1], OFFICES[2], OFFICES[3]] },
  { region: "Middle East", cities: [OFFICES[4]] },
];

function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function fmtTime(now: Date | null, tz: string) {
  if (!now) return "--:--";
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

function LocationsPage() {
  const now = useNow();
  const [band, setBand] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setBand((b) => (b + 1) % OFFICES.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <main className="min-h-screen bg-white text-[#111111]" style={inter}>
      <SiteNav />

      {/* hero */}
      <section className="mx-auto max-w-6xl px-6 pt-40 pb-8 md:pt-44">
        <Reveal>
          <p className="text-[13px] text-[#1e6b3c] " style={mono}>
            ELSIAA on the ground
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.04em] md:text-6xl" style={inter}>
            We're where our clients are —
            <br className="hidden md:block" /> and we go anywhere.
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[#111111]/60" style={inter}>
            We have people on the ground in six cities across three continents — New
            York, Los Angeles, London, Geneva, Antwerp, and Tel Aviv. All work is fully
            insured. When the job is somewhere else, we travel to it and work anywhere in
            the world. Visits are by appointment; virtual support runs 24/7.
          </p>
        </Reveal>
      </section>

      {/* the numbers */}
      <section className="mx-auto max-w-6xl px-6 pb-2">
        <Reveal>
          <div className="grid grid-cols-2 gap-y-8 border-y border-black/[0.06] py-8 md:grid-cols-4">
            {[
              { n: 6, s: "", label: "Cities on the ground" },
              { n: 3, s: "", label: "Continents active" },
              { n: 24, s: "/7", label: "Virtual support, every day" },
              { n: 100, s: "%", label: "Fully insured work" },
            ].map((st) => (
              <div key={st.label} className="text-center">
                <p className="text-4xl font-semibold tracking-[-0.04em] md:text-5xl" style={inter}>
                  <CountTo target={st.n} suffix={st.s} />
                </p>
                <p className="mt-2 text-[13px] text-[#111111]/55 " style={mono}>
                  {st.label}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* the network — globe + regional ledger */}
      <section className="mx-auto max-w-6xl px-6 py-14 md:py-20">
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-[460px_minmax(0,1fr)]">
          <Reveal>
            <ScrollGlobe size={460} />
            <p className="mt-2 text-center text-[13px] text-[#111111]/50 " style={mono}>
              Scroll or drag to spin
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            {REGIONS.map((r) => (
              <div key={r.region} className="border-b border-black/[0.06] py-5 first:pt-0 last:border-0">
                <p className="text-[13px] text-[#1e6b3c] " style={mono}>
                  {r.region}
                </p>
                <div className="mt-3 space-y-2.5">
                  {r.cities.map((c) => (
                    <div key={c.name} className="flex items-baseline justify-between gap-6">
                      <p className="flex items-center gap-2.5 text-[16px] font-semibold tracking-[-0.01em]" style={inter}>
                        <img
                          src={`/assets/flags/${c.flag}.png`}
                          srcSet={`/assets/flags/${c.flag}@2x.png 2x`}
                          alt=""
                          className="h-[13px] w-[19px] rounded-[2px] object-cover ring-1 ring-black/10"
                        />
                        {c.name}
                        {c.hq && (
                          <span className="rounded-full bg-[#1e6b3c]/10 px-2.5 py-0.5 text-[13px] text-[#1e6b3c] " style={mono}>
                            HQ
                          </span>
                        )}
                      </p>
                      <p className="text-[14px] tabular-nums text-[#111111]/55" style={mono}>
                        {fmtTime(now, c.tz)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* follow-the-sun coverage strip */}
      <section className="border-y border-black/[0.06] bg-[#F5F5F3]">
        <div className="mx-auto max-w-6xl px-6 py-14 md:py-16">
          <Reveal>
            <p className="text-[13px] text-[#1e6b3c] " style={mono}>
              Follow the sun
            </p>
            <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-[-0.035em] md:text-4xl" style={inter}>
              A desk is always awake.
            </h2>
            <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-[#111111]/55" style={inter}>
              From Tel Aviv opening the day to Los Angeles closing it, our cities cover
              the clock end to end — questions get answered while the rest of the firm sleeps.
            </p>
          </Reveal>

          <Reveal delay={0.08}>
            <CoverageArc now={now} />
          </Reveal>
        </div>
      </section>

      {/* rotating city band */}
      <section className="relative h-[280px] overflow-hidden border-b border-black/[0.06] bg-white md:h-[340px]">
        {OFFICES.map((o, i) => (
          <img
            key={o.name}
            src={o.art}
            alt=""
            loading={i === 0 ? "eager" : "lazy"}
            className={`absolute inset-0 h-full w-full object-cover object-bottom transition-opacity duration-[1400ms] ${
              i === band ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-white/70 via-transparent to-white/40" />
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3">
          <p className="flex items-center gap-3 text-xl font-semibold tracking-[-0.02em]" style={inter}>
            <img
              src={`/assets/flags/${OFFICES[band].flag}.png`}
              srcSet={`/assets/flags/${OFFICES[band].flag}@2x.png 2x`}
              alt=""
              className="h-[13px] w-[19px] rounded-[2px] object-cover ring-1 ring-black/10"
            />
            {OFFICES[band].name}
            <span className="text-[14px] font-medium tabular-nums text-[#111111]/55" style={mono}>
              {fmtTime(now, OFFICES[band].tz)}
            </span>
          </p>
          <div className="flex gap-2">
            {OFFICES.map((o, i) => (
              <button
                key={o.name}
                aria-label={o.name}
                onClick={() => setBand(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === band ? "w-6 bg-[#1e6b3c]" : "w-2 bg-black/15 hover:bg-black/30"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* office cards */}
      <section className="mx-auto max-w-6xl px-6 py-14 md:py-20">
        <Reveal>
          <p className="text-[13px] text-[#1e6b3c] " style={mono}>
            The Directory
          </p>
          <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-[-0.035em] md:text-4xl" style={inter}>
            People on the ground in six cities.
          </h2>
          <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-[#111111]/55" style={inter}>
            Real presence, not a mailbox. Each city has a working team you can meet
            in person by appointment — the same people, the same standard, wherever
            you engage us. Exact addresses are shared when we book.
          </p>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
          {OFFICES.map((o, i) => (
            <Reveal key={o.name} delay={(i % 2) * 0.06}>
              <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-black/[0.07] bg-white transition-all duration-300 hover:-translate-y-1 hover:border-[#1e6b3c]/35 hover:shadow-[0_30px_70px_-45px_rgba(17,17,17,0.35)]">
                {/* city art header */}
                <div className="relative h-[180px] overflow-hidden bg-white">
                  <img
                    src={o.art}
                    alt={`${o.name} skyline`}
                    loading="lazy"
                    className="h-full w-full object-cover object-bottom transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                  <span
                    className="absolute top-4 right-4 flex items-center gap-2 rounded-full border border-black/[0.08] bg-white/85 px-3.5 py-1.5 text-[13px] font-medium tabular-nums backdrop-blur"
                    style={mono}
                  >
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#1e6b3c]" />
                    {fmtTime(now, o.tz)}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="flex items-center gap-2.5 text-[19px] font-semibold tracking-[-0.02em]" style={inter}>
                        <img
                          src={`/assets/flags/${o.flag}.png`}
                          srcSet={`/assets/flags/${o.flag}@2x.png 2x`}
                          alt=""
                          className="h-[13px] w-[19px] rounded-[2px] object-cover ring-1 ring-black/10"
                        />
                        {o.name}
                        {o.hq && (
                          <span className="rounded-full bg-[#1e6b3c]/10 px-2 py-0.5 text-[13px] text-[#1e6b3c] " style={mono}>
                            HQ
                          </span>
                        )}
                      </h3>
                      <p className="mt-1.5 text-[13px] text-[#111111]/45 " style={mono}>
                        {o.country} · {fmtOffset(now, o.tz, o.tzLabel)}
                      </p>
                    </div>
                    <span className="shrink-0 text-[13px] text-[#1e6b3c] " style={mono}>
                      {o.role}
                    </span>
                  </div>

                  <p className="mt-4 text-[14px] leading-relaxed text-[#111111]/70" style={inter}>
                    {o.line}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {o.focus.map((f) => (
                      <span
                        key={f}
                        className="rounded-full border border-black/[0.08] bg-[#F5F5F3] px-3 py-1 text-[13px] text-[#111111]/65"
                        style={inter}
                      >
                        {f}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6 border-t border-black/[0.06] pt-5">
                    <p className="flex items-center gap-2 text-[13px] font-medium text-[#111111]/80" style={inter}>
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#1e6b3c]" />
                      On-site team available by appointment
                    </p>
                    <p className="mt-1.5 text-[13px] text-[#111111]/45" style={mono}>
                      Exact address provided upon booking
                    </p>
                    <a
                      href="/contact"
                      className="mt-4 inline-block text-[13px] text-[#1e6b3c] transition-colors hover:text-[#111111]"
                      style={mono}
                    >
                      Reach this desk →
                    </a>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <p className="mt-8 text-[13px] text-[#111111]/55" style={inter}>
            On-site meetings are by appointment. Everything else runs remotely, in
            your timezone, around the clock.
          </p>
        </Reveal>
      </section>

      {/* global flexibility */}
      <section className="border-t border-black/[0.06] bg-[#F5F5F3]">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <Reveal>
            <p className="text-[13px] text-[#1e6b3c] " style={mono}>
              Anywhere in the world
            </p>
            <h2 className="mt-3 max-w-3xl text-2xl font-semibold tracking-[-0.035em] md:text-4xl" style={inter}>
              Six cities is where we live. Not where we stop.
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[#111111]/60" style={inter}>
              Our people can deploy and work anywhere on earth. If your business is
              outside these six cities, we come to you — on-site when it matters, and
              fully remote the rest of the time, in your timezone, around the clock.
            </p>
          </Reveal>
        </div>
      </section>

      {/* insurance & trust */}
      <section className="border-t border-black/[0.06] bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-3 px-6 py-10 md:flex-row md:items-center md:justify-between">
          <p className="flex items-center gap-3 text-[15px] font-medium text-[#111111]/80" style={inter}>
            <span className="inline-block h-2 w-2 rounded-full bg-[#1e6b3c]" />
            Every engagement is fully insured — the same standard in all six cities and anywhere we travel.
          </p>
          <a href="/clients" className="text-[13px] text-[#1e6b3c] hover:underline" style={mono}>
            How we work ↗
          </a>
        </div>
      </section>

      {/* closing */}
      <section className="mx-auto max-w-6xl border-t border-black/[0.06] px-6 py-16 text-center md:py-24">
        <Reveal>
          <h2 className="mx-auto max-w-2xl text-2xl font-semibold tracking-[-0.03em] md:text-4xl" style={inter}>
            Tell us where you are. We'll be there — or already awake for you.
          </h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/contact"
              className="inline-flex items-center gap-3 rounded-full bg-[#111111] px-8 py-4 text-[13px] font-bold text-white transition-all duration-300 hover:bg-[#1e6b3c]"
              style={mono}
            >
              Book a call →
            </a>
            <a
              href="/contact"
              className="inline-flex items-center gap-3 rounded-full border border-[#111111]/20 px-8 py-4 text-[13px] font-bold text-[#111111] transition-all duration-300 hover:border-[#1e6b3c] hover:text-[#1e6b3c]"
              style={mono}
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
  Follow-the-sun strip — a restrained emerald hairline arc spanning the six
  cities by longitude, with the sun's approximate position marked from the
  current UTC hour. Pure inline SVG; guards for SSR (now === null → static).
*/
function CoverageArc({ now }: { now: Date | null }) {
  const W = 1000;
  const H = 200;
  const padX = 40;
  const baseY = 150;
  const xFor = (lon: number) => padX + ((lon + 180) / 360) * (W - padX * 2);

  // arc apex (purely aesthetic)
  const arcTop = 46;

  // cities evenly spaced west→east so clustered European offices never collide
  const sorted = [...OFFICES].sort((a, b) => a.lon - b.lon);
  const cityX = (i: number) => padX + (i / (sorted.length - 1)) * (W - padX * 2);

  // sun x from current UTC time (subsolar longitude ≈ 180 − 15 * UTCHours)
  const sunLon = now
    ? ((180 - 15 * (now.getUTCHours() + now.getUTCMinutes() / 60) + 540) % 360) - 180
    : null;

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-black/[0.07] bg-white p-4 md:p-6">
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
              <text
                x={x}
                y={baseY + 26}
                textAnchor="middle"
                fontSize="12"
                fill="#111111"
                fillOpacity="0.6"
                style={mono}
              >
                {fmtTime(now, o.tz)}
              </text>
              <text
                x={x}
                y={baseY + 44}
                textAnchor="middle"
                fontSize="11"
                letterSpacing="1.5"
                fill="#111111"
                fillOpacity="0.42"
                style={{ ...mono, textTransform: "" }}
              >
                {o.name.split(" ")[0]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
