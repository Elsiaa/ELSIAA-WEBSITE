import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SiteNav } from "../components/SiteNav";

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
      { property: "og:image", content: "/assets/og_cover.png" },
    ],
  }),
  component: LocationsPage,
});

const mono = { fontFamily: "'IBM Plex Mono', monospace" } as const;
const inter = { fontFamily: "'Inter', sans-serif" } as const;

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

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (e) => {
        if (e[0].isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: on ? 1 : 0,
        transform: on ? "none" : "translateY(22px)",
        transition: `opacity .8s ease ${delay}s, transform .8s cubic-bezier(.2,.8,.2,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function LocationsPage() {
  const now = useNow();
  const time = (tz: string) =>
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
            Locations
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-0.04em] md:text-6xl" style={inter}>
            One standard. Every timezone.
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[#111111]/55" style={inter}>
            Six cities, three continents — on site by appointment, and virtual
            support around the clock. Walk into any of them and the standard
            is the same.
          </p>
        </Reveal>
      </section>

      {/* office cards */}
      <section className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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
                    <span className="text-[9px] tracking-[0.24em] text-[#1e6b3c] uppercase" style={mono}>
                      ELSIAA
                    </span>
                  </div>
                  <p className="mt-1.5 text-[13px] text-[#111111]/50" style={inter}>
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
                      className="text-[10px] tracking-[0.24em] text-[#111111]/45 uppercase transition-colors hover:text-[#1e6b3c]"
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
          <p className="mt-8 text-[12px] text-[#111111]/40" style={inter}>
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
