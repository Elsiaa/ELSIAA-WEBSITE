import { useEffect, useRef, useState } from "react";
import { Reveal } from "./Reveal";

/*
  SoftwareDemos — the homepage opener.
  A carousel of real shipped software, each slide a framed demo you can
  walk through: the recorded Mr. Bins walkthrough film, and the live
  Dialog Healthcare / Elbaz Law / PSI Construction builds embedded and
  scrollable. Auto-advances (pauses on hover/touch, off for reduced
  motion); only the active slide loads its media so the page stays fast.
*/

const mono = { fontFamily: "'IBM Plex Mono', monospace" } as const;
const inter = { fontFamily: "'Inter', sans-serif" } as const;

type Demo = {
  eyebrow: string;
  name: string;
  pitch: string;
  steps: [string, string, string];
  cta: { label: string; href: string; external?: boolean };
  media: { kind: "video"; src: string; poster: string } | { kind: "site"; src: string; zoom?: number };
};

const DEMOS: Demo[] = [
  {
    eyebrow: "E-commerce · Walkthrough film",
    name: "Mr. Bins",
    pitch: "A mystery-box store rebuilt end to end — watch the recorded walkthrough of the finished build.",
    steps: [
      "Land on a hero that sells the thrill, not the shipping terms",
      "Browse drops and mystery tiers without leaving the flow",
      "Check out in one screen — cart to confirmation",
    ],
    cta: { label: "Open the full demo", href: "/mr-bins/index.html", external: true },
    media: { kind: "video", src: "/mr-bins/mrbins-walk.mp4", poster: "/mr-bins/mrbins-shoes-poster.jpg" },
  },
  {
    eyebrow: "Healthcare platform · Live site",
    name: "Dialog Healthcare",
    pitch: "A staffing platform rebuilt around one promise — the right clinician, placed fast. This is the live site; scroll it.",
    steps: [
      "One clear route in for facilities, one for clinicians",
      "Roles and specialties surfaced before the paperwork",
      "Request staff in a form that respects your time",
    ],
    cta: { label: "Visit dialoghealthcare.com", href: "https://dialoghealthcare.com", external: true },
    media: { kind: "site", src: "https://dialoghealthcare.com", zoom: 0.5 },
  },
  {
    eyebrow: "Professional services · Live site",
    name: "Michael Elbaz Law",
    pitch: "Counsel that reads like counsel — an editorial presence that wins trust before the first call. Live build, embedded.",
    steps: [
      "An opening statement, not a stock-photo hero",
      "Practice areas written in plain language",
      "One unmistakable path to the consultation",
    ],
    cta: { label: "View the live build", href: "https://elbaz-law.higgsfield.app", external: true },
    media: { kind: "site", src: "https://elbaz-law.higgsfield.app", zoom: 0.5 },
  },
  {
    eyebrow: "Construction · Live site",
    name: "PSI Construction",
    pitch: "A contractor's credibility, poured in concrete — portfolio first, paperwork last. Scroll the live site.",
    steps: [
      "The work leads — full-bleed project photography",
      "Capabilities laid out like a bid sheet",
      "Contact routes that reach a person, not a queue",
    ],
    cta: { label: "Visit psiconstructionpa.com", href: "https://www.psiconstructionpa.com", external: true },
    media: { kind: "site", src: "https://www.psiconstructionpa.com", zoom: 0.5 },
  },
];

function DemoMedia({ demo, active }: { demo: Demo; active: boolean }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  // load once the slide first becomes active; keep it after that
  useEffect(() => {
    if (active) setLoaded(true);
  }, [active]);
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (active) v.play().catch(() => {});
    else v.pause();
  }, [active]);
  if (demo.media.kind === "video") {
    return (
      <video
        ref={videoRef}
        src={demo.media.src}
        poster={demo.media.poster}
        muted
        loop
        playsInline
        preload={active ? "auto" : "none"}
        className="h-full w-full object-cover"
        aria-label={`${demo.name} — recorded walkthrough`}
      />
    );
  }
  const zoom = demo.media.zoom ?? 0.5;
  return loaded ? (
    <iframe
      src={demo.media.src}
      title={`${demo.name} — live site demo`}
      loading="lazy"
      className="origin-top-left"
      style={{
        width: `${100 / zoom}%`,
        height: `${100 / zoom}%`,
        transform: `scale(${zoom})`,
        border: "0",
      }}
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-[#ECECEA]">
      <span className="text-[10px] tracking-[0.3em] text-black/30 uppercase" style={mono}>
        Loading live site…
      </span>
    </div>
  );
}

export function SoftwareDemos() {
  const [idx, setIdx] = useState(0);
  const paused = useRef(false);
  const demo = DEMOS[idx];

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      if (!paused.current) setIdx((i) => (i + 1) % DEMOS.length);
    }, 9000);
    return () => clearInterval(t);
  }, []);

  const go = (d: number) => setIdx((i) => (i + d + DEMOS.length) % DEMOS.length);

  return (
    <section
      className="border-b border-black/[0.06] bg-white pt-28 pb-12 md:pt-32 md:pb-16"
      aria-label="Software demos — walkthroughs of shipped work"
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
      onTouchStart={() => (paused.current = true)}
      onTouchEnd={() => (paused.current = false)}
    >
      <div className="mx-auto w-full max-w-6xl px-6">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase" style={mono}>
                Live demos · Software we shipped
              </p>
              <h2
                className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-[#111111] md:text-4xl"
                style={inter}
              >
                Don't take our word for it. Walk through it.
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                aria-label="Previous demo"
                onClick={() => go(-1)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-[#111111] transition-all hover:border-[#1e6b3c] hover:bg-[#1e6b3c] hover:text-white"
              >
                ←
              </button>
              <button
                aria-label="Next demo"
                onClick={() => go(1)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-[#111111] transition-all hover:border-[#1e6b3c] hover:bg-[#1e6b3c] hover:text-white"
              >
                →
              </button>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="mt-7 grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,340px)_1fr] md:gap-8">
            {/* walkthrough rail */}
            <div className="order-2 md:order-1">
              <p className="text-[10px] tracking-[0.28em] text-[#111111]/40 uppercase" style={mono}>
                {demo.eyebrow}
              </p>
              <h3 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[#111111]" style={inter}>
                {demo.name}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[#111111]/55" style={inter}>
                {demo.pitch}
              </p>
              <ol className="mt-5 space-y-3">
                {demo.steps.map((s, i) => (
                  <li key={s} className="flex gap-3">
                    <span
                      className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[#1e6b3c]/10 text-[10px] font-bold text-[#1e6b3c]"
                      style={mono}
                    >
                      {i + 1}
                    </span>
                    <span className="text-[13.5px] leading-relaxed text-[#111111]/65" style={inter}>
                      {s}
                    </span>
                  </li>
                ))}
              </ol>
              <a
                href={demo.cta.href}
                {...(demo.cta.external ? { target: "_blank", rel: "noreferrer" } : {})}
                className="mt-6 inline-block text-[11px] tracking-[0.24em] text-[#1e6b3c] uppercase hover:underline"
                style={mono}
              >
                {demo.cta.label} ↗
              </a>
              {/* dots */}
              <div className="mt-6 flex items-center gap-2" role="tablist" aria-label="Demos">
                {DEMOS.map((d, i) => (
                  <button
                    key={d.name}
                    role="tab"
                    aria-selected={i === idx}
                    aria-label={`Show ${d.name} demo`}
                    onClick={() => setIdx(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === idx ? "w-8 bg-[#1e6b3c]" : "w-3 bg-black/15 hover:bg-black/30"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* framed demo */}
            <div className="order-1 md:order-2">
              <div className="overflow-hidden rounded-2xl border border-black/[0.09] bg-white shadow-[0_30px_80px_-50px_rgba(17,17,17,0.45)]">
                {/* browser chrome */}
                <div className="flex items-center gap-2 border-b border-black/[0.06] bg-[#FBFBFA] px-4 py-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-black/10" />
                  <span className="h-2.5 w-2.5 rounded-full bg-black/10" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#1e6b3c]/50" />
                  <span
                    className="ml-3 truncate rounded-md bg-black/[0.04] px-3 py-1 text-[10px] tracking-[0.12em] text-[#111111]/45"
                    style={mono}
                  >
                    {demo.media.kind === "site" ? demo.media.src.replace("https://", "") : `${demo.name.toLowerCase().replace(/[^a-z]/g, "")}.walkthrough`}
                  </span>
                </div>
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#ECECEA]">
                  {DEMOS.map((d, i) => (
                    <div
                      key={d.name}
                      className={`absolute inset-0 transition-opacity duration-500 ${
                        i === idx ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0"
                      }`}
                    >
                      <DemoMedia demo={d} active={i === idx} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
