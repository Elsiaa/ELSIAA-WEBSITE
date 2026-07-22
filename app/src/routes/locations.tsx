import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SiteNav } from "../components/SiteNav";
import { ScrollGlobe, CountTo } from "../components/ScrollGlobe";
import { Reveal } from "../components/Reveal";

export const Route = createFileRoute("/locations")({
  head: () => ({
    meta: [
      { title: "Locations — ELSIAA · AI Done Better" },
      {
        name: "description",
        content:
          "ELSIAA on the ground — offices in New York, London, Geneva, Antwerp, Tel Aviv, and Los Angeles. One standard, every timezone.",
      },
      { property: "og:title", content: "Locations — ELSIAA" },
      { property: "og:image", content: "https://elsiaa.higgsfield.app/assets/og_cover.png" },
    ],
    links: [{ rel: "canonical", href: "https://elsiaa.higgsfield.app/locations" }],
  }),
  component: LocationsPage,
});

const mono = { fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" } as const;
const inter = { fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" } as const;

const OFFICES = [
  {
    name: "New York City",
    flag: "us",
    tz: "America/New_York",
    art: "/assets/cityart/nyc.jpg",
    address: ["415 Madison Avenue, 21st Floor", "New York, NY 10017", "United States"],
    line: "Where the pride began. The Americas HQ.",
  },
  {
    name: "London",
    flag: "gb",
    tz: "Europe/London",
    art: "/assets/cityart/london.jpg",
    address: ["12 Berkeley Street, Mayfair", "London W1J 8DT", "United Kingdom"],
    line: "The European front door.",
  },
  {
    name: "Geneva",
    flag: "ch",
    tz: "Europe/Zurich",
    art: "/assets/cityart/geneva.jpg",
    address: ["Rue du Rhône 62", "1204 Genève", "Switzerland"],
    line: "Precision work for precision clients.",
  },
  {
    name: "Antwerp",
    flag: "be",
    tz: "Europe/Brussels",
    art: "/assets/cityart/antwerp.jpg",
    address: ["Meir 24", "2000 Antwerpen", "Belgium"],
    line: "The Benelux desk.",
  },
  {
    name: "Tel Aviv",
    flag: "il",
    tz: "Asia/Jerusalem",
    art: "/assets/cityart/telaviv.jpg",
    address: ["Rothschild Blvd 45", "Tel Aviv-Yafo 6688312", "Israel"],
    line: "The technology engine room.",
  },
  {
    name: "Los Angeles",
    flag: "us",
    tz: "America/Los_Angeles",
    art: "/assets/cityart/la.jpg",
    address: ["9601 Wilshire Blvd", "Beverly Hills, CA 90210", "United States"],
    line: "The West Coast chapter.",
  },
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

function LocationsPage() {
  const now = useNow();
  const [band, setBand] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setBand((b) => (b + 1) % OFFICES.length), 5000);
    return () => clearInterval(t);
  }, []);
  const time = (tz: string) =>
    !now ? "--:--:--" :
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: tz,
    }).format(now);
  return (
    <main className="min-h-screen bg-white text-[#111111]">
      <SiteNav />

      {/* hero */}
      <section className="mx-auto max-w-6xl px-6 pt-40 pb-6 md:pt-44">
        <Reveal>
          <p className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase" style={mono}>
            ELSIAA Worldwide
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-0.04em] md:text-6xl" style={inter}>
            One standard. Every timezone.
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[#111111]/55" style={inter}>
            Six cities, three continents, one standard. On site by
            appointment — support around the clock.
          </p>
        </Reveal>
      </section>

      {/* the numbers — a company that counts */}
      <section className="mx-auto max-w-6xl px-6 pt-6 pb-2">
        <Reveal>
          <div className="grid grid-cols-2 gap-y-8 border-y border-black/[0.06] py-8 md:grid-cols-4">
            {[
              { n: 6, s: "", label: "Offices worldwide" },
              { n: 3, s: "", label: "Continents covered" },
              { n: 10, s: "", label: "Leaders & advisors" },
              { n: 24, s: "/7", label: "Support, every timezone" },
            ].map((st) => (
              <div key={st.label} className="text-center">
                <p className="text-4xl font-semibold tracking-[-0.04em] md:text-5xl" style={inter}>
                  <CountTo target={st.n} suffix={st.s} />
                </p>
                <p className="mt-2 text-[10px] tracking-[0.24em] text-[#111111]/55 uppercase" style={mono}>
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
            <p className="mt-2 text-center text-[10px] tracking-[0.24em] text-[#111111]/50 uppercase" style={mono}>
              Scroll or drag to spin
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            {[
              { region: "Americas", cities: [OFFICES[0], OFFICES[5]] },
              { region: "Europe", cities: [OFFICES[1], OFFICES[2], OFFICES[3]] },
              { region: "Middle East", cities: [OFFICES[4]] },
            ].map((r) => (
              <div key={r.region} className="border-b border-black/[0.06] py-5 first:pt-0 last:border-0">
                <p className="text-[10px] tracking-[0.3em] text-[#1e6b3c] uppercase" style={mono}>
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
                        {c.name === "New York City" && (
                          <span className="rounded-full bg-[#1e6b3c]/10 px-2.5 py-0.5 text-[10px] tracking-[0.18em] text-[#1e6b3c] uppercase" style={mono}>
                            HQ
                          </span>
                        )}
                      </p>
                      <p className="text-[14px] tabular-nums text-[#111111]/55" style={mono}>
                        {time(c.tz)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* rotating city band */}
      <section className="relative h-[280px] overflow-hidden border-y border-black/[0.06] bg-white md:h-[340px]">
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
              {time(OFFICES[band].tz)}
            </span>
          </p>
          <div className="flex gap-2">
            {OFFICES.map((o, i) => (
              <button
                key={o.name}
                aria-label={o.name}
                onClick={() => setBand(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === band ? "w-6 bg-[#1e6b3c]" : "w-1.5 bg-black/15 hover:bg-black/30"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* office cards */}
      <section className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <Reveal>
          <p className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase" style={mono}>
            The Directory
          </p>
          <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-[-0.035em] md:text-4xl" style={inter}>
            Walk into any of them.
          </h2>
        </Reveal>
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          {OFFICES.map((o, i) => (
            <Reveal key={o.name} delay={(i % 2) * 0.06}>
              <div className="group overflow-hidden rounded-2xl border border-black/[0.07] bg-white transition-all duration-300 hover:-translate-y-1 hover:border-[#1e6b3c]/35 hover:shadow-[0_30px_70px_-45px_rgba(17,17,17,0.35)]">
                {/* city art header */}
                <div className="relative h-[190px] overflow-hidden bg-white">
                  <img
                    src={o.art}
                    alt={`${o.name} — digitalized skyline`}
                    loading="lazy"
                    className="h-full w-full object-cover object-bottom transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                  <span
                    className="absolute top-4 right-4 rounded-full border border-black/[0.08] bg-white/85 px-3.5 py-1.5 text-[12px] font-medium tabular-nums backdrop-blur"
                    style={mono}
                  >
                    {time(o.tz)}
                  </span>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="flex items-center gap-2.5 text-[19px] font-semibold tracking-[-0.02em]" style={inter}>
                      <img
                        src={`/assets/flags/${o.flag}.png`}
                        srcSet={`/assets/flags/${o.flag}@2x.png 2x`}
                        alt=""
                        className="h-[13px] w-[19px] rounded-[2px] object-cover ring-1 ring-black/10"
                      />
                      {o.name}
                    </h2>
                    <span className="text-[10px] tracking-[0.24em] text-[#1e6b3c] uppercase" style={mono}>
                      ELSIAA
                    </span>
                  </div>
                  <p className="mt-1.5 text-[13px] text-[#111111]/60" style={inter}>
                    {o.line}
                  </p>
                  <address className="mt-4 border-l-2 border-[#1e6b3c]/30 pl-4 text-[14px] leading-relaxed text-[#111111]/70 not-italic" style={inter}>
                    {o.address.map((l) => (
                      <span key={l} className="block">
                        {l}
                      </span>
                    ))}
                  </address>
                  <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
                    <a
                      href={`https://maps.google.com/maps?q=${encodeURIComponent(`${o.address[0]}, ${o.address[1]}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] tracking-[0.24em] text-[#1e6b3c] uppercase hover:underline"
                      style={mono}
                    >
                      Open in Maps ↗
                    </a>
                    <a
                      href="/contact"
                      className="text-[10px] tracking-[0.24em] text-[#111111]/55 uppercase transition-colors hover:text-[#1e6b3c]"
                      style={mono}
                    >
                      Book a visit →
                    </a>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <p className="mt-8 text-[12px] text-[#111111]/55" style={inter}>
            Visits are by appointment — book a call and we'll set it up.
            Virtual support runs 24/7 in every timezone.
          </p>
        </Reveal>
      </section>

      {/* closing */}
      <section className="mx-auto max-w-6xl border-t border-black/[0.06] px-6 py-16 text-center">
        <Reveal>
          <p className="text-lg font-semibold tracking-[-0.02em] md:text-2xl" style={inter}>
            Closest office: your inbox.
          </p>
          <a
            href="/contact"
            className="mt-5 inline-flex items-center gap-3 rounded-full bg-[#111111] px-8 py-4 text-[11px] font-bold tracking-[0.22em] text-white uppercase transition-all duration-300 hover:bg-[#1e6b3c]"
            style={mono}
          >
            Book the free call →
          </a>
        </Reveal>
      </section>
    </main>
  );
}
