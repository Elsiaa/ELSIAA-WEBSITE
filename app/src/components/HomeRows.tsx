import { useEffect, useRef, useState } from "react";
import { StickyCTA } from "./StickyCTA";
import { AssemblingArtist } from "./AssemblingArtist";
import { WorkingRobot } from "./WorkingRobot";
import { ScrollGlobe, CountTo } from "./ScrollGlobe";
import { Reveal } from "./Reveal";
import { ConsultOptions } from "./ConsultOptions";
import { WhyBrandsChose } from "./BrandLogos";
import { SoftwareDemos } from "./SoftwareDemos";
import { SocialHomeSection } from "./SocialMedia";

/* ============================================================
   ELSIAA homepage — built from Isya's notebook sketch 06/20/26
   Mobile-first: graphic block + title + subcategory card
   carousel per division, consultation pricing, locations, team.
   ============================================================ */

/* ---------- global scroll progress — thin emerald line above everything ---------- */
function ScrollProgress() {
  const [w, setW] = useState(0);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = document.documentElement;
        const max = h.scrollHeight - h.clientHeight;
        setW(max > 0 ? (h.scrollTop / max) * 100 : 0);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div className="fixed inset-x-0 top-0 z-[60] h-[2px] bg-transparent">
      <div
        className="h-full bg-[#1e6b3c] transition-[width] duration-150 ease-out"
        style={{ width: `${w}%` }}
      />
    </div>
  );
}

/* ---------- scroll parallax: gentle vertical drift while the element crosses the viewport ---------- */
function Parallax({ children, amount = 26 }: { children: React.ReactNode; amount?: number }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const progress = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
        el.style.transform = `translateY(${(-progress * amount).toFixed(1)}px)`;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [amount]);
  return <div ref={ref} style={{ willChange: "transform" }}>{children}</div>;
}


/* ---------- shared row carousel: arrows + swipe + gentle drift ---------- */
function Rail({
  children,
  drift = 0.35,
}: {
  children: React.ReactNode;
  drift?: number;
}) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const paused = useRef(false);
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollLeft = 0; // always open on a clean first card
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let pos = 0;
    let startAt = performance.now() + 2200; // settle before drifting
    rail.addEventListener("scroll", () => {
      if (Math.abs(rail.scrollLeft - pos) > 2) pos = rail.scrollLeft;
    });
    const tick = () => {
      if (!paused.current && performance.now() > startAt) {
        pos += drift;
        const half = rail.scrollWidth / 2;
        if (pos >= half) pos -= half;
        rail.scrollLeft = pos;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [drift]);
  const nudge = (d: number) =>
    railRef.current?.scrollBy({ left: d * 300, behavior: "smooth" });
  return (
    // full-bleed: the rail breaks out of the page container and runs to ~2mm
    // from each screen edge; cards fade in/out through the edge masks below
    <div
      className="relative left-1/2 -translate-x-1/2 px-2"
      style={{ width: "calc(100vw - var(--sbw, 0px))" }}
    >
      <button
        aria-label="Previous"
        onClick={() => nudge(-1)}
        className="absolute top-1/2 left-1 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/95 text-[#111111] shadow-md backdrop-blur transition-all hover:border-[#1e6b3c] hover:bg-[#1e6b3c] hover:text-white"
      >
        ←
      </button>
      <button
        aria-label="Next"
        onClick={() => nudge(1)}
        className="absolute top-1/2 right-1 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/95 text-[#111111] shadow-md backdrop-blur transition-all hover:border-[#1e6b3c] hover:bg-[#1e6b3c] hover:text-white"
      >
        →
      </button>
      <div
        ref={railRef}
        tabIndex={0}
        role="group"
        aria-label="Scrollable list — use the left and right arrow keys"
        onPointerEnter={() => (paused.current = true)}
        onPointerLeave={() => (paused.current = false)}
        onTouchStart={() => (paused.current = true)}
        onTouchEnd={() => (paused.current = false)}
        onFocus={() => (paused.current = true)}
        onBlur={() => (paused.current = false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") { e.preventDefault(); nudge(1); }
          if (e.key === "ArrowLeft") { e.preventDefault(); nudge(-1); }
        }}
        className="flex gap-2.5 overflow-x-auto px-2 pb-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e6b3c] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0, black 84px, black calc(100% - 84px), transparent 100%)",
          maskImage:
            "linear-gradient(to right, transparent 0, black 84px, black calc(100% - 84px), transparent 100%)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ---------- one division row: graphic + title + subcategory cards ---------- */
export type Sub = { name: string; items: string[] };

function DivisionRow({
  n,
  title,
  lede,
  img,
  graphic,
  subs,
  href,
  cta,
  extra,
}: {
  n: string;
  title: string;
  lede: string;
  img?: string;
  graphic?: React.ReactNode;
  subs: Sub[];
  href: string;
  cta?: string;
  extra?: React.ReactNode;
}) {
  return (
 <section className="bg-white py-8 md:py-12">
      <div className="mx-auto w-full max-w-6xl px-6">
        {/* header + graphic — one clean composed row */}
        <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-[minmax(0,1fr)_640px] md:gap-6">
          <Reveal className="order-2 md:order-1">
            <h2
              className="text-3xl font-semibold tracking-[-0.035em] text-[#111111] md:text-5xl"
              style={{ fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
            >
              {title}
            </h2>
            <p
              className="mt-3 max-w-md text-[15px] text-[#111111]/60"
              style={{ fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
            >
              {lede}
            </p>
            <a
              href={href}
              className="mt-5 inline-block text-[13px] text-[#1e6b3c]  hover:underline"
              style={{ fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
            >
              {cta ?? "Explore"} ↗
            </a>
          </Reveal>
          <Reveal className="order-1 md:order-2">
            <Parallax>
            <a href={href} className="group block bg-white">
              {graphic ?? (
                <img
                  src={img}
                  alt={title}
                  loading="lazy"
                  className="aspect-[3/2] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
              )}
            </a>
            </Parallax>
          </Reveal>
        </div>
        {/* the catalog — every group once, no repeats */}
        {subs.length > 0 && (
        <Reveal delay={0.1}>
        <div className="mt-10">
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:min-w-[78%] [&>*]:snap-start md:grid md:snap-none md:overflow-visible md:pb-0 md:[&>*]:min-w-0 md:grid-cols-3 lg:grid-cols-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e6b3c]">
            {subs.map((s, i) => (
              <a
                key={`${s.name}-${i}`}
                href={href}
                className="group flex flex-col rounded-xl border border-black/[0.07] bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#1e6b3c]/35 hover:shadow-[0_18px_44px_-30px_rgba(17,17,17,0.3)]"
              >
                <div className="flex items-center justify-between">
                  <h3
                    className="text-[13.5px] font-semibold tracking-[-0.01em] text-[#111111]"
                    style={{ fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
                  >
                    {s.name}
                  </h3>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-black/10 text-[13px] text-[#111111]/60 transition-all group-hover:border-[#1e6b3c] group-hover:bg-[#1e6b3c] group-hover:text-white">
                    →
                  </span>
                </div>
                <ul className="mt-2.5 space-y-1">
                  {s.items.map((it) => (
                    <li
                      key={it}
                      className="text-[13px] leading-snug text-[#111111]/55"
                      style={{ fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
                    >
                      {it}
                    </li>
                  ))}
                </ul>
              </a>
            ))}
          </div>
        </div>
        </Reveal>
        )}
        {extra}
      </div>
    </section>
  );
}


/* ---------- AI industry statistics ---------- */
const STATS = [
  { pct: 78, industry: "All industries", line: "of organizations already run AI in at least one business function. The other 22% are competing against it." },
  { pct: 66, industry: "Healthcare", line: "of physicians already practice with AI at their side. Medicine didn't wait for permission." },
  { pct: 91, industry: "Finance", line: "of financial firms are deploying or assessing AI right now. The desks that aren't are being priced out." },
  { pct: 71, industry: "Marketing", line: "of marketing teams ship with generative AI weekly. Entire creative departments, compressed into a prompt." },
  { pct: 63, industry: "Retail", line: "of retailers already bank revenue they attribute to AI. The registers learned faster than the staff." },
  { pct: 55, industry: "Manufacturing", line: "of manufacturers run AI on the production floor. The night shift doesn't sleep anymore — it computes." },
];

/* Renders the FINAL percentage by default (SSR, crawlers, reduced motion) and
   only animates from 0 as an enhancement — a missed trigger can never leave
   a stat stuck at 0%. */
function CountUp({ target }: { target: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(target);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return; // keep the final value
    }
    let raf = 0;
    let watchdog = 0;
    const dur = 1400;
    const run = () => {
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - t0) / dur, 1);
        setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      watchdog = window.setTimeout(() => {
        cancelAnimationFrame(raf);
        setVal(target);
      }, dur + 1500);
    };
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) {
      run();
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(watchdog);
      };
    }
    const io = new IntersectionObserver(
      (e) => {
        if (!e[0].isIntersecting) return;
        io.disconnect();
        run();
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(watchdog);
    };
  }, [target]);
  return (
    <span ref={ref} className="tabular-nums">
      {val}%
    </span>
  );
}

/* ---------- the opener: the world changed — hero + the count, one dark screen ---------- */
/* the hero lion — same concept as the Design planet: it comes to life.
   Starts grey and colourless, blooms into a full-colour living lion with a
   soft emerald life-glow; edges feather into the white so it's part of the
   page, not a pasted photo. Carries what ELSIAA stands for. */
/* The hero is a pinned scroll-scrub: on desktop the page holds still on a
   sticky full-height stage while your scroll brings the lion from grey to full
   colour. Only once he's fully alive does the pin release and the page scrolls
   on. On mobile / reduced-motion it degrades to a normal hero with a live lion. */
function HomeHero() {
  const sans = { fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" };
  const vidRef = useRef<HTMLVideoElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);

  // The lion is the ELSIAA logo mark, animated: mouth closed at the top, and it
  // opens into a full roar AS YOU SCROLL (the clip's currentTime is scrubbed
  // from scroll position). A rising emerald glow + slight scale add life.
  useEffect(() => {
    const v = vidRef.current;
    if (!v) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { v.loop = true; v.play().catch(() => {}); return; }
    v.pause();
    v.play().then(() => v.pause()).catch(() => {}); // prime decoding for seeks
    const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
    let raf = 0;
    const tick = () => {
      const sc = window.scrollY || document.documentElement.scrollTop || 0;
      // complete the full roar within half a screen of scroll, so the whole
      // roar is seen while the lion is still on screen
      const p = clamp01(sc / (window.innerHeight * 0.5));
      const d = v.duration;
      if (d && !Number.isNaN(d)) {
        const target = Math.min(d - 0.04, p * d);
        const cur = v.currentTime;
        // all-keyframe clip → seeks are instant; ease finely for buttery motion
        if (Math.abs(target - cur) > 0.006) {
          try { v.currentTime = cur + (target - cur) * 0.35; } catch { /* seeking */ }
        }
      }
      if (v) v.style.transform = `scale(${(1 + p * 0.06).toFixed(3)})`;
      if (glowRef.current) glowRef.current.style.opacity = (0.14 + p * 0.5).toFixed(3);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section className="relative bg-white">
      <div className="mx-auto flex max-w-4xl flex-col items-center px-6 pt-36 pb-10 text-center md:pt-44">
        {/* headline — centred */}
        <Reveal>
          <h1 className="mx-auto max-w-4xl text-4xl font-semibold leading-[1.02] tracking-[-0.045em] text-[#111111] md:text-7xl" style={sans}>
            Unlock the potential of your business with{" "}
            <span className="text-[#1e6b3c]">AI</span>.
          </h1>
        </Reveal>

        {/* quick nav into the divisions */}
        <Reveal delay={0.06}>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
            {[
              { label: "Why ELSIAA", href: "/why-elsiaa" },
              { label: "Automations", href: "/automate" },
              { label: "Design", href: "/designs" },
              { label: "Social Media", href: "/social" },
            ].map((b) => (
              <a
                key={b.href}
                href={b.href}
                className="inline-flex min-h-[46px] items-center rounded-full border border-black/[0.12] bg-white px-6 text-[14px] font-semibold text-[#111111] transition-all hover:-translate-y-0.5 hover:border-[#1e6b3c] hover:text-[#1e6b3c]"
                style={sans}
              >
                {b.label}
              </a>
            ))}
          </div>
        </Reveal>

        {/* the lion — the ELSIAA logo, front-facing, roars as you scroll */}
        <div className="pointer-events-none relative mt-8 w-full max-w-[380px]">
          <div
            ref={glowRef}
            className="absolute inset-[14%] -z-10 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle at 50% 46%, rgba(30,107,60,0.45), transparent 66%)", opacity: 0.14 }}
          />
          <video
            ref={vidRef}
            src="/assets/lion_logo_roar_smooth.mp4"
            muted
            playsInline
            preload="auto"
            aria-label="The ELSIAA lion — roars as you scroll"
            className="mx-auto block w-full will-change-transform"
            style={{
              mixBlendMode: "multiply",
              // push the near-white clip background to pure white and feather
              // the edges so only the lion sits on the page
              filter: "brightness(1.07) contrast(1.05)",
              WebkitMaskImage: "radial-gradient(122% 126% at 50% 46%, #000 62%, rgba(0,0,0,0) 88%)",
              maskImage: "radial-gradient(122% 126% at 50% 46%, #000 62%, rgba(0,0,0,0) 88%)",
            }}
          />
        </div>

        {/* ELSIAA wordmark, written out, centred */}
        <p className="-mt-1 text-3xl font-semibold tracking-[0.36em] text-[#111111] md:text-4xl" style={sans}>
          ELSIAA
        </p>
        <p className="mt-3 text-[10px] leading-relaxed tracking-[0.18em] text-[#111111]/55 uppercase" style={sans}>
          <b className="font-semibold text-[#1e6b3c]">E</b>ternal{" "}
          <b className="font-semibold text-[#1e6b3c]">L</b>ions ·{" "}
          <b className="font-semibold text-[#1e6b3c]">S</b>olutions ·{" "}
          <b className="font-semibold text-[#1e6b3c]">I</b>nnovation ·{" "}
          <b className="font-semibold text-[#1e6b3c]">A</b>utomation ·{" "}
          <b className="font-semibold text-[#1e6b3c]">A</b>lliance
        </p>

        {/* thin locations ticker — a quiet marquee of where ELSIAA is */}
        <a
          href="/locations"
          className="pointer-events-auto group mt-7 block w-full max-w-[620px] overflow-hidden border-t border-black/[0.07] py-2.5"
          aria-label="Our locations"
        >
          <div className="loc-ticker flex w-max whitespace-nowrap">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex shrink-0" aria-hidden={copy === 1}>
                {["New York", "Los Angeles", "London", "Geneva", "Antwerp", "Tel Aviv", "Baltimore", "Montvale", "Kingston"].map((c) => (
                  <span key={c} className="flex items-center">
                    <span className="px-5 text-[11px] font-medium tracking-[0.2em] text-[#111111]/45 uppercase transition-colors group-hover:text-[#111111]/70" style={sans}>
                      {c}
                    </span>
                    <span className="text-[#1e6b3c]/60" aria-hidden>·</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </a>
      </div>
    </section>
  );
}

/* ---------- Automation: robot + walkthrough, per sketch ---------- */
function AutomationSection() {
  const sans = { fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" } as const;
  const trackRef = useRef<HTMLElement | null>(null);
  const vidRef = useRef<HTMLVideoElement | null>(null);
  const [typed, setTyped] = useState(0);
  const LINE = "AI robots like me can automate your business!";

  // Scroll-controlled, beginning to end: the stage pins while the robot's
  // animation (wave → point + stare → wave) is scrubbed by your scroll, then
  // the page releases. Reduced motion: plain autoplay loop.
  useEffect(() => {
    const v = vidRef.current;
    const track = trackRef.current;
    if (!v || !track) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      v.loop = true;
      v.play().catch(() => {});
      return;
    }
    v.loop = true;
    v.play().catch(() => {}); // always waving while the bubble types
    const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
    let raf = 0;
    const tick = () => {
      const r = track.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      const p = clamp01(span > 0 ? -r.top / span : 0);
      // comic bubble types itself out across the first half of the scrub
      setTyped(Math.round(clamp01(p / 0.55) * LINE.length));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // vertical feather + multiply + brightness lift → the clip's studio backdrop
  // disappears into the pure-white page
  const feather = "radial-gradient(120% 120% at 50% 46%, #000 62%, rgba(0,0,0,0) 90%)";

  return (
    <section ref={trackRef} className="relative bg-white" style={{ height: "170vh" }} id="automation">
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center gap-1 overflow-hidden bg-white px-6 text-center">
        {/* titled like the design centrepiece */}
        <h2 className="text-4xl font-semibold tracking-[-0.04em] text-[#111111] md:text-6xl" style={sans}>
          Automations
        </h2>
        {/* robot + bubble anchored together */}
        <div className="pointer-events-none relative inline-block">
          <video
            ref={vidRef}
            src="/assets/robot3d_wave_v2.mp4"
            poster="/assets/robot3d_wave_v2.jpg"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onCanPlay={(e) => { e.currentTarget.play().catch(() => {}); }}
            onLoadedData={(e) => { e.currentTarget.play().catch(() => {}); }}
            aria-label="The ELSIAA robot, waving"
            className="block w-auto select-none"
            style={{
              height: "min(52vh, 440px)",
              mixBlendMode: "multiply",
              filter: "brightness(1.07) contrast(1.04)",
              WebkitMaskImage: feather,
              maskImage: feather,
            }}
          />
          {/* speech bubble — sits just off the robot's head, tail at the mouth */}
          <div
            aria-hidden={typed === 0}
            className="absolute top-[13%] right-full z-10 mr-3 w-[46vw] max-w-[260px] rounded-[20px] border border-black/10 bg-white px-4 py-3 text-left shadow-[0_12px_30px_-12px_rgba(17,17,17,0.28)] transition-opacity duration-300 sm:mr-4 sm:w-[260px] md:top-[15%] md:w-[290px] md:px-5 md:py-3.5"
            style={{ opacity: typed > 0 ? 1 : 0, fontFamily: "'Bangers', 'Schibsted Grotesk', system-ui, sans-serif" }}
          >
            {/* invisible copy reserves the final size so typing never reflows */}
            <p className="invisible text-[16px] leading-[1.25] tracking-[0.015em] md:text-[19px]">{LINE}</p>
            <p className="absolute inset-x-4 top-3 text-[16px] leading-[1.25] tracking-[0.015em] text-[#111111] md:inset-x-5 md:top-3.5 md:text-[19px]">
              {LINE.slice(0, typed)}
              <span
                className="ml-[2px] inline-block h-[0.9em] w-[2px] translate-y-[2px] bg-[#1e6b3c]"
                style={{ opacity: typed < LINE.length ? 1 : 0 }}
              />
            </p>
            <span className="absolute top-[58%] -right-[7px] h-3.5 w-3.5 rotate-45 border-t border-r border-black/10 bg-white" />
          </div>
        </div>
      </div>
    </section>
  );
}

function GlobeReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setP(1);
      return;
    }
    const on = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const t = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.9)));
      setP(t);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <div
      ref={ref}
      style={{
        filter: `brightness(${0.15 + p * 0.85}) saturate(${0.2 + p * 0.8})`,
        transition: "filter .15s linear",
      }}
    >
      <ScrollGlobe size={300} />
    </div>
  );
}

function HeroCards() {
  const items = [
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e6b3c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M8.5 12.5 11 15l4.5-6" />
        </svg>
      ),
      title: "Any process, automated.",
      body: "If your team can run it — sales, operations, clinical intake, legal — we can teach a model to run it faster, and around the clock.",
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e6b3c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-3.6 8-10V5l-8-3-8 3v7c0 6.4 8 10 8 10Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      ),
      title: "Fixed scope. Fixed price.",
      body: "Scoped plans and measured results — automation built to pay for itself, not an open-ended research project.",
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e6b3c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 17l6-6 4 4 8-8" />
          <path d="M14 7h7v7" />
        </svg>
      ),
      title: "One partner, four divisions.",
      body: "Design, automation, software, and consultation under one roof — no relay race between a design shop, a dev agency, and a consultant.",
    },
  ];
  return (
 <section className="bg-white py-14 md:py-16">
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {items.map((it, i) => (
            <Reveal key={it.title} delay={0.05 + i * 0.05}>
              <div className="h-full rounded-2xl border border-black/[0.07] bg-white p-7 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#1e6b3c]/35">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1e6b3c]/10">
                  {it.icon}
                </span>
                <h2
                  className="mt-4 text-[17px] font-semibold tracking-[-0.02em] text-[#111111]"
                  style={{ fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
                >
                  {it.title}
                </h2>
                <p
                  className="mt-2 text-[14px] leading-relaxed text-[#111111]/55"
                  style={{ fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
                >
                  {it.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- data: the full catalog ---------- */
// Ordered most-in-demand → niche (both the categories and the items in each).
export const DESIGN: Sub[] = [
  { name: "Branding", items: ["Branding & Logo Design", "Brand Identity", "Packaging Design", "Print Design"] },
  { name: "Web", items: ["Website Design", "Landing Pages", "UI/UX Design", "E-commerce Design", "SaaS Interfaces", "Dashboard Design"] },
  { name: "Marketing", items: ["Social Media Graphics", "Marketing Graphics", "Motion Graphics", "Presentation Design"] },
  { name: "Product", items: ["3D Product Renders", "Commercial Imagery", "Product Staging"] },
  { name: "Apps", items: ["Mobile App Design", "iOS & Android UI", "App Store Assets"] },
];
export const AUTOMATION: Sub[] = [
  { name: "AI", items: ["AI Agents & Assistants", "AI Workflow Automation"] },
  { name: "Sales", items: ["Lead Qualification", "CRM Automation", "Appointment Booking", "Quote Follow-ups", "Proposal Generation", "Pipeline Alerts"] },
  { name: "Marketing", items: ["Social Posting Automation", "Ad Performance Reports", "Newsletter Automation"] },
  { name: "Customer Support", items: ["Customer Follow-up", "Email Automation", "Ticket Triage & Routing", "Review Management", "Slack & Discord Bots"] },
  { name: "Operations", items: ["Internal Business Automation", "Document Processing", "API Integrations", "Data Entry Automation", "Zapier / Make Automation", "Inventory Sync", "Meeting Notes → CRM", "Web Scraping"] },
  { name: "Finance", items: ["Invoice Automation", "Reporting Dashboards", "Payment Reminders", "Expense Processing", "Payroll Automation"] },
  { name: "HR", items: ["Recruiting Screening", "Employee Onboarding"] },
];
export const SOFTWARE: Sub[] = [
  { name: "Web", items: ["Custom Web Applications", "SaaS Development", "Client Portals"] },
  { name: "AI", items: ["AI Applications", "AI Chatbots"] },
  { name: "Mobile", items: ["iOS Apps", "Android Apps"] },
  { name: "Enterprise", items: ["CRM Development", "Internal Company Software", "Employee Dashboards", "Inventory Systems", "ERP Systems"] },
  { name: "Infrastructure", items: ["API Development", "Cloud Infrastructure", "Database Architecture", "Maintenance & Support"] },
];
export const CONSULTATION: Sub[] = [
  { name: "Strategy", items: ["1-on-1 Strategy Calls", "AI Implementation Consulting", "Digital Transformation"] },
  { name: "Technology", items: ["Software Architecture Review", "Technical Due Diligence", "CTO Advisory", "Code Reviews"] },
  { name: "Business", items: ["Business Process Audits", "Automation Planning", "Team Training", "Ongoing Monthly Advisory"] },
  { name: "Product", items: ["Product Roadmapping", "Startup MVP Planning", "UX Audits"] },
  { name: "Growth", items: ["Marketing Strategy", "Funnel & Conversion Advisory"] },
];

/* ---------- merged: automation + software, one carousel ---------- */
export const AUTOSOFT: Sub[] = (() => {
  const m = new Map<string, string[]>();
  for (const g of [...AUTOMATION, ...SOFTWARE]) {
    m.set(g.name, [...(m.get(g.name) ?? []), ...g.items.filter((it) => !(m.get(g.name) ?? []).includes(it))]);
  }
  return [...m.entries()].map(([name, items]) => ({ name, items }));
})();

/* ---------- consultation pricing (stripe-ready tiers) ---------- */


function ConsultPricing() {
  return (
    <div className="mt-6">
      <ConsultOptions />
    </div>
  );
}



/* ---------- locations — the city desk: live clocks, one active city ---------- */
const CITIES = [
  { name: "New York City", q: "Manhattan, New York", flag: "us", tz: "America/New_York", art: "/assets/cityart/nyc.jpg" },
  { name: "London", q: "London, UK", flag: "gb", tz: "Europe/London", art: "/assets/cityart/london.jpg" },
  { name: "Geneva", q: "Geneva, Switzerland", flag: "ch", tz: "Europe/Zurich", art: "/assets/cityart/geneva.jpg" },
  { name: "Antwerp", q: "Antwerp, Belgium", flag: "be", tz: "Europe/Brussels", art: "/assets/cityart/antwerp.jpg" },
  { name: "Tel Aviv", q: "Tel Aviv, Israel", flag: "il", tz: "Asia/Jerusalem", art: "/assets/cityart/telaviv.jpg" },
  { name: "Los Angeles", q: "Los Angeles, California", flag: "us", tz: "America/Los_Angeles", art: "/assets/cityart/la.jpg" },
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

function cityTime(now: Date | null, tz: string) {
  if (!now) return "--:--:--";
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: tz,
  }).format(now);
}

function cityDay(now: Date | null, tz: string) {
  if (!now) return "···";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: tz,
  }).format(now);
}

function Locations() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const now = useNow();
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % CITIES.length), 6000);
    return () => clearInterval(t);
  }, [paused]);
  const active = CITIES[idx];
  const mono = { fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" } as const;
  const inter = { fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" } as const;
  return (
    <section
      className="relative overflow-hidden border-t border-black/[0.06] bg-white py-16 text-[#111111] md:py-16"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* skyline backdrop — bright, anchored bottom-right, crossfading */}
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[68%] md:block">
        {CITIES.map((c, i) => (
          <img
            key={c.name}
            src={c.art}
            alt=""
            loading={i === 0 ? "eager" : "lazy"}
            className={`absolute inset-0 h-full w-full object-contain object-right-bottom transition-opacity duration-[1400ms] ${
              i === idx ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/25 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <Reveal>
          <p className="text-[13px] text-[#1e6b3c] " style={mono}>
            05 · Locations
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] md:text-4xl" style={inter}>
            One standard. Every timezone.
          </h2>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed text-[#111111]/55" style={inter}>
            <span className="font-semibold text-[#111111]">24/7 virtual support</span> — and
            in person, on site, in six cities. Right now it's{" "}
            <span className="font-semibold text-[#1e6b3c]">{cityTime(now, active.tz).slice(0, 5)}</span>{" "}
            in {active.name}.
          </p>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,420px)_1fr]">
          {/* the city desk — live clocks */}
          <Reveal delay={0.08}>
            <div role="tablist" aria-label="ELSIAA cities">
              {CITIES.map((c, i) => (
                <button
                  key={c.name}
                  role="tab"
                  aria-selected={i === idx}
                  onClick={() => setIdx(i)}
                  className={`group flex w-full items-center gap-4 border-b border-black/[0.06] py-3.5 text-left transition-all duration-300 ${
                    i === idx ? "" : "opacity-45 hover:opacity-80"
                  }`}
                >
                  <span
                    className={`h-8 w-[3px] flex-none rounded-full transition-colors duration-300 ${
                      i === idx ? "bg-[#1e6b3c]" : "bg-black/[0.08]"
                    }`}
                  />
                  <img
                    src={`/assets/flags/${c.flag}.png`}
                    srcSet={`/assets/flags/${c.flag}@2x.png 2x`}
                    alt=""
                    className="h-[13px] w-[19px] flex-none rounded-[2px] object-cover ring-1 ring-black/10"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15.5px] font-semibold tracking-[-0.01em]" style={inter}>
                      {c.name}
                    </span>
                    <span
                      className={`block text-[13px]  transition-colors ${
                        i === idx ? "text-[#1e6b3c]" : "text-[#111111]/50"
                      }`}
                      style={mono}
                    >
                      {i === idx ? "On site now" : "ELSIAA office"}
                    </span>
                  </span>
                  <span className="text-right">
                    <span
                      className={`block text-[17px] font-medium tabular-nums transition-colors ${
                        i === idx ? "text-[#111111]" : "text-[#111111]/55"
                      }`}
                      style={mono}
                    >
                      {cityTime(now, c.tz)}
                    </span>
                    <span className="block text-[13px] text-[#111111]/50 " style={mono}>
                      {cityDay(now, c.tz)} · local
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </Reveal>

          {/* open air — the skyline owns this side */}
          <div className="hidden md:block" aria-hidden />
        </div>

        {/* map on demand — never blocks the art */}
        <Reveal delay={0.14}>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={() => setShowMap((v) => !v)}
              className="rounded-full border border-black/12 bg-white/80 px-6 py-2.5 text-[10.5px] font-bold text-[#111111]  backdrop-blur transition-all hover:border-[#1e6b3c] hover:text-[#1e6b3c]"
              style={mono}
            >
              {showMap ? "Hide map" : `Map of ${active.name}`} {showMap ? "↑" : "↓"}
            </button>
            <a
              href={`https://maps.google.com/maps?q=${encodeURIComponent(active.q)}`}
              target="_blank"
              rel="noreferrer"
              className="text-[13px] text-[#1e6b3c]  hover:underline"
              style={mono}
            >
              Open in Google Maps ↗
            </a>
          </div>
          <div
            className="overflow-hidden transition-all duration-500 ease-out"
            style={{ maxHeight: showMap ? 260 : 0, opacity: showMap ? 1 : 0 }}
          >
            <div className="mt-4 overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-[0_24px_60px_-45px_rgba(17,17,17,0.4)]">
              {showMap && (
                <iframe
                  key={active.name}
                  title={`Map — ${active.name}`}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(active.q)}&z=11&output=embed`}
                  loading="lazy"
                  className="h-[220px] w-full grayscale-[0.25]"
                  style={{ border: 0 }}
                />
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- team ---------- */
const TEAM = [
  { name: "Yisrael Krug", role: "Founder & Chief Executive Officer", init: "YK", photo: "/assets/team/yk.jpg" },
  { name: "David Heimowitz", role: "Co-Founder & Chief Technology Officer", init: "DH", photo: "/assets/team/dh.jpg" },
  { name: "Jacob Rubelow", role: "Partner & Chief Operating Officer", init: "JR", photo: "/assets/team/jr.jpg" },
  { name: "Chaim Lieberman", role: "Executive Director & Partner", init: "CL", photo: "/assets/team/cl.jpg" },
  { name: "Izzy Eisenberg", role: "Director of California Business", init: "IE", photo: "/assets/team/ie.jpg" },
  { name: "Ynon Azulai", role: "AI & Technology Expert · Jerusalem", init: "YA", photo: "/assets/team/ya.jpg" },
];

function Team() {
  return (
    <section className="bg-white py-8 md:py-12">
      <div className="mx-auto max-w-5xl px-6">
        <Reveal>
          <p
            className="text-[13px] text-[#1e6b3c] "
            style={{ fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
          >
            04 · Who we are
          </p>
          <h2
            className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-[#111111] md:text-4xl"
            style={{ fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
          >
            Leadership of consequence.
          </h2>
          <p
            className="mt-3 max-w-xl text-[15px] text-[#111111]/60"
            style={{ fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
          >
            Founders, executives, and tenured professors — decades of academic
            distinction and enterprise success at one table.
          </p>
        </Reveal>
        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TEAM.slice(0, 6).map((m, i) => (
            <Reveal key={m.name} delay={i * 0.05}>
              <div className="group flex items-center gap-3.5 rounded-xl border border-black/[0.07] bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#1e6b3c]/35">
                <img
                  src={m.photo}
                  alt={m.name}
                  loading="lazy"
                  className="flex-none rounded-full border border-black/[0.06] object-cover"
                  style={{ width: 52, height: 52 }}
                />
                <div>
                  <h3 className="text-[15px] font-semibold text-[#111111]" style={{ fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}>
                    {m.name}
                  </h3>
                  <p className="mt-0.5 text-[13px] text-[#111111]/60" style={{ fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}>
                    {m.role}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <a
            href="/team"
            className="mt-8 inline-flex items-center gap-3 rounded-full border border-[#111111]/15 px-7 py-3.5 text-[13px] font-bold text-[#111111]  transition-all duration-300 hover:border-[#1e6b3c] hover:bg-[#1e6b3c] hover:text-white"
            style={{ fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
          >
            Meet the leadership →
          </a>
        </Reveal>
      </div>
    </section>
  );
}


/* ---------- the merch strip: one clean line + carousel ---------- */
const MERCH = [
  { img: "/assets/store/dtd_fitted_black.jpg", name: "Fitted Professional Tee", price: "$68" },
  { img: "/assets/store/dtd_tailored_white.jpg", name: "Tailored Casual Tee", price: "$64" },
  { img: "/assets/store/dtd_oversized_grey.jpg", name: "Relaxed Oversized Tee", price: "$72" },
  { img: "/assets/store/merch_pants.jpg", name: "ELSIAA Pants", price: "$118" },
  { img: "/assets/store/city_ny_cobalt.jpg", name: "New York Hoodie", price: "$188" },
  { img: "/assets/store/city_la_coral.jpg", name: "Los Angeles Tee", price: "$148" },
  { img: "/assets/store/city_ldn_lilac.jpg", name: "London Crewneck", price: "$178" },
  { img: "/assets/store/city_zrh_swiss.jpg", name: "Zürich Tee", price: "$168" },
  { img: "/assets/store/merch_tlv.jpg", name: "Tel Aviv Tee", price: "$148" },
  { img: "/assets/store/om_ivory.jpg", name: "Old Money Tee — Ivory", price: "$128" },
  { img: "/assets/store/om_navy.jpg", name: "Old Money Tee — Navy", price: "$128" },
  { img: "/assets/store/obj_mug.jpg", name: "Black Mug", price: "$28" },
  { img: "/assets/store/obj_cap.jpg", name: "Cap", price: "$48" },
  { img: "/assets/store/obj_tote.jpg", name: "Tote", price: "$42" },
];

function MerchStrip() {
  return (
 <section className="bg-white py-8 md:py-12">
      <div className="mx-auto w-full max-w-6xl px-6">
        <Reveal>
          <p
            className="text-[13px] text-[#1e6b3c] "
            style={{ fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
          >
            06 · The Store
          </p>
          <h2
            className="mt-2 max-w-2xl text-2xl font-semibold tracking-[-0.035em] text-[#111111] md:text-3xl"
            style={{ fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
          >
            The ELSIAA Store.
          </h2>
          <p
            className="mt-3 max-w-md text-[15px] text-[#111111]/60"
            style={{ fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
          >
            You asked where we got our merch. Here it is.
          </p>
          <a
            href="/store"
            className="mt-5 inline-block text-[13px] text-[#1e6b3c]  hover:underline"
            style={{ fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
          >
            Shop the store ↗
          </a>
        </Reveal>
      </div>
      <Reveal delay={0.08}>
      <div className="mt-8">
        <div
          tabIndex={0}
          role="group"
          aria-label="Scrollable list — use the left and right arrow keys"
          onKeyDown={(e) => {
            const el = e.currentTarget;
            if (e.key === "ArrowRight") { e.preventDefault(); el.scrollBy({ left: Math.min(el.clientWidth * 0.8, 420), behavior: "smooth" }); }
            if (e.key === "ArrowLeft") { e.preventDefault(); el.scrollBy({ left: -Math.min(el.clientWidth * 0.8, 420), behavior: "smooth" }); }
          }}
          className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e6b3c]">
          {MERCH.slice(0, 8).map((m, i) => (
            <a
              key={`${m.name}-${i}`}
              href="/store"
              className="group w-[170px] flex-none"
            >
              <div className="overflow-hidden rounded-xl border border-black/[0.06] bg-white">
                <img
                  src={m.img}
                  alt={m.name}
                  loading="lazy"
                  className="aspect-[3/4] w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                />
              </div>
              <div className="mt-2.5 flex items-baseline justify-between px-0.5">
                <p className="text-[13.5px] font-semibold text-[#111111]" style={{ fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}>{m.name}</p>
                <p className="text-[12.5px] text-[#111111]/60" style={{ fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}>{m.price}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
      </Reveal>
    </section>
  );
}

/* ---------- closing CTA — the next step, unmissable ---------- */
function FinalCTA() {
  return (
 <section className="bg-[#0c0c0c] py-10 text-white md:py-14">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <Reveal>
          <p
            className="text-[13px] text-[#2e9e58] "
            style={{ fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
          >
            07 · Next
          </p>
          <h2
            className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.035em] md:text-5xl"
            style={{ fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
          >
            Let's build your first system.
          </h2>
          <p
            className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-white/55"
            style={{ fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
          >
            Tell us the step that still waits on a person. We'll scope it, price it, and show you the before and after.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/contact"
              className="rounded-full bg-[#2e9e58] px-10 py-5 text-[13px] font-bold text-white  transition-all duration-300 hover:bg-white hover:text-[#111111]"
              style={{ fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
            >
              Start with a free call →
            </a>
            <a
              href="/quote"
              className="rounded-full border border-white/25 px-8 py-4 text-[13px] font-bold text-white  transition-all duration-300 hover:border-white hover:bg-white hover:text-[#111111]"
              style={{ fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
            >
              Get a Quote
            </a>
          </div>
          <p
            className="mt-5 text-[13px] text-white/50"
            style={{ fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
          >
            20 minutes. No pitch. Straight answers on where AI actually pays off for you.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- automation capability catalog — one single-row carousel ---------- */
function AutomationCatalog() {
  const sans = "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif";
  const rowRef = useRef<HTMLDivElement | null>(null);
  const nudge = (dir: number) => {
    const el = rowRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.8, 520), behavior: "smooth" });
  };
  return (
 <section className="bg-white pb-12 pt-2 md:pb-14 md:pt-3" id="automation-catalog">
      <div className="mx-auto w-full max-w-6xl px-6">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-xl">
              <h3 className="text-2xl font-semibold tracking-[-0.03em] text-[#111111] md:text-3xl" style={{ fontFamily: sans }}>
                We automate your business.
              </h3>
              <p className="mt-3 text-[14.5px] leading-relaxed text-[#111111]/60" style={{ fontFamily: sans }}>
                Sales, operations, finance, support and more — built for you, and running around the clock.
              </p>
            </div>
            <a href="/automate" className="inline-flex items-center gap-2 rounded-full bg-[#1e6b3c] px-7 py-3 text-[13px] font-bold text-white transition-all hover:bg-[#111111]" style={{ fontFamily: sans }}>
              Discover automations →
            </a>
          </div>
        </Reveal>

        {/* single row — a carousel; grey arrows make the affordance obvious */}
        <Reveal delay={0.08}>
          <div className="relative mt-5">
            <button
              type="button"
              aria-label="Scroll left"
              onClick={() => nudge(-1)}
              className="absolute top-1/2 -left-3 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-black/10 bg-white/90 text-[18px] text-[#111111]/55 shadow-[0_10px_30px_-12px_rgba(17,17,17,0.35)] backdrop-blur transition-all hover:border-[#1e6b3c]/40 hover:text-[#1e6b3c] md:grid"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Scroll right"
              onClick={() => nudge(1)}
              className="absolute top-1/2 -right-3 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-black/10 bg-white/90 text-[18px] text-[#111111]/55 shadow-[0_10px_30px_-12px_rgba(17,17,17,0.35)] backdrop-blur transition-all hover:border-[#1e6b3c]/40 hover:text-[#1e6b3c] md:grid"
            >
              ›
            </button>

            <div
              ref={rowRef}
        tabIndex={0}
        role="group"
        aria-label="Scrollable list — use the left and right arrow keys"
        onKeyDown={(e) => {
          const el = e.currentTarget;
          if (e.key === "ArrowRight") { e.preventDefault(); el.scrollBy({ left: Math.min(el.clientWidth * 0.8, 420), behavior: "smooth" }); }
          if (e.key === "ArrowLeft") { e.preventDefault(); el.scrollBy({ left: -Math.min(el.clientWidth * 0.8, 420), behavior: "smooth" }); }
        }}
              className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e6b3c]"
            >
              {AUTOSOFT.map((s, i) => (
                <a
                  key={`${s.name}-${i}`}
                  href="/services"
                  className="group flex w-[248px] shrink-0 snap-start flex-col rounded-xl border border-black/[0.07] bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#1e6b3c]/35 hover:shadow-[0_18px_44px_-30px_rgba(17,17,17,0.3)]"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-[13.5px] font-semibold tracking-[-0.01em] text-[#111111]" style={{ fontFamily: sans }}>
                      {s.name}
                    </h4>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-black/10 text-[13px] text-[#111111]/60 transition-all group-hover:border-[#1e6b3c] group-hover:bg-[#1e6b3c] group-hover:text-white">
                      →
                    </span>
                  </div>
                  <ul className="mt-2.5 space-y-1">
                    {s.items.map((it) => (
                      <li key={it} className="text-[13px] leading-snug text-[#111111]/55" style={{ fontFamily: sans }}>
                        {it}
                      </li>
                    ))}
                  </ul>
                </a>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- Design division: rock → living earth, scroll-scrubbed ----------
   One sphere, hard circular clip, two perfectly-registered layers.
   Life crosses the planet as a dawn line — a rotating light sweep — driven
   directly by scroll with lerp smoothing. Copy arrives in stages:
   rock (cold) → dawn (curiosity) → alive (revelation) → CTA (desire).
   Reduced motion: static living earth. */
function DesignDivision() {
  const inter = { fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" } as const;
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const earthRef = useRef<HTMLImageElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const sphereRef = useRef<HTMLDivElement | null>(null);
  const cap1Ref = useRef<HTMLParagraphElement | null>(null);
  const cap2Ref = useRef<HTMLParagraphElement | null>(null);
  const ctaRef = useRef<HTMLDivElement | null>(null);
  const hintRef = useRef<HTMLParagraphElement | null>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReduced(true);
      return;
    }
    const wrap = wrapRef.current;
    if (!wrap) return;
    let raf = 0;
    let sp = 0; // smoothed progress
    const set = (el: HTMLElement | null, o: Partial<CSSStyleDeclaration>) => { if (el) Object.assign(el.style, o); };
    const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
    const seg = (p: number, a2: number, b2: number) => (p <= a2 ? 0 : p >= b2 ? 1 : (p - a2) / (b2 - a2));
    const ease = (t: number) => t * t * (3 - 2 * t); // smoothstep
    const tick = () => {
      const r = wrap.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      const target = span > 0 ? clamp01(-r.top / span) : 0;
      sp += (target - sp) * 0.14; // lerp — momentum without lag
      const p = sp;

      // ONE seamless earth: a grey, colourless, artless planet that turns
      // beautiful and full-colour in place as you scroll — same globe, no moon.
      const reveal = ease(seg(p, 0.06, 0.6));
      set(earthRef.current, {
        filter: `grayscale(${(1 - reveal).toFixed(2)}) saturate(${(0.12 + reveal * 0.98).toFixed(2)}) contrast(${(1 + reveal * 0.06).toFixed(2)})`,
      });

      // atmosphere glow blooms as life crosses in
      const alive = ease(seg(p, 0.42, 0.68));
      set(glowRef.current, { opacity: String(0.05 + alive * 0.6) });

      // the planet settles: slight grow + upright rotation
      const grow = 0.86 + ease(seg(p, 0, 0.7)) * 0.14;
      const rot = -8 + ease(seg(p, 0, 0.7)) * 8;
      set(sphereRef.current, { transform: `scale(${grow.toFixed(3)}) rotate(${rot.toFixed(2)}deg)` });

      // copy arc
      set(cap1Ref.current, { opacity: String(Math.max(0, 1 - seg(p, 0.18, 0.36))) });
      set(cap2Ref.current, { opacity: String(seg(p, 0.5, 0.66)), transform: `translateY(${(1 - ease(seg(p, 0.5, 0.66))) * 10}px)` });
      set(ctaRef.current, { opacity: String(seg(p, 0.68, 0.84)), transform: `translateY(${(1 - ease(seg(p, 0.68, 0.84))) * 12}px)`, pointerEvents: p > 0.7 ? "auto" : "none" });
      set(hintRef.current, { opacity: String(Math.max(0, 1 - seg(p, 0.1, 0.28))) });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const Sphere = ({ live }: { live: boolean }) => (
    <div className="relative flex items-center justify-center" style={{ width: "min(58vh, min(82vw, 440px))", height: "min(58vh, min(82vw, 440px))" }}>
      {/* green life-glow behind the planet */}
      <div
        ref={live ? undefined : glowRef}
        className="pointer-events-none absolute h-[82%] w-[82%] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(46,158,88,0.42), transparent 67%)", opacity: live ? 0.5 : 0.06 }}
      />
      <div ref={live ? undefined : sphereRef} className="relative aspect-square w-full will-change-transform">
        {/* one earth on pure white — no clip, no ring; grey → full colour */}
        <img
          ref={live ? undefined : earthRef}
          src="/assets/cine/earth_white.jpg"
          alt="Planet earth"
          className="absolute inset-0 h-full w-full object-contain"
          style={{ filter: live ? "none" : "grayscale(1) saturate(0.12)" }}
        />
      </div>
    </div>
  );

  if (reduced) {
    return (
 <section className="bg-white py-8 md:py-12">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-6 text-center">
          <h2 className="text-4xl font-semibold tracking-[-0.04em] text-[#111111] md:text-6xl" style={inter}>Design</h2>
          <Sphere live />
          <p className="max-w-md text-[15px] leading-relaxed text-[#111111]/60" style={inter}>
            A world without design is a rock. Design gives it life — a living surface for every screen your brand meets.
          </p>
          <a href="/designs" className="inline-flex min-h-[48px] items-center rounded-full bg-[#1e6b3c] px-7 text-[15px] font-semibold text-white transition-all hover:bg-[#111111]" style={inter}>Discover design →</a>
        </div>
        <div className="mt-14"><DesignCatalog /></div>
      </section>
    );
  }

  return (
    <>
 <section ref={wrapRef} className="relative bg-white" style={{ height: "170vh" }}>
        <div className="sticky top-0 flex h-screen flex-col items-center justify-center gap-4 overflow-hidden px-6 text-center">
          <div>
            <h2 className="mt-1 text-5xl font-semibold tracking-[-0.045em] text-[#111111] md:text-7xl" style={inter}>Design</h2>
          </div>
          <Sphere live={false} />
          <div className="relative h-[64px] w-full max-w-lg">
            <p ref={cap1Ref} className="absolute inset-x-0 mx-auto max-w-md text-[16px] leading-relaxed text-[#111111]/65" style={inter}>
              A world without design is a rock.
              <span className="mt-0.5 block text-[13.5px] text-[#111111]/40">Cold. Correct. Forgettable.</span>
            </p>
            <p ref={cap2Ref} className="absolute inset-x-0 mx-auto max-w-md text-[16px] leading-relaxed text-[#111111]/80 opacity-0" style={inter}>
              Design gives it life.
              <span className="mt-0.5 block text-[13.5px] text-[#111111]/50">A living surface for every screen your brand meets.</span>
            </p>
          </div>
          <div ref={ctaRef} className="opacity-0" style={{ pointerEvents: "none" }}>
            <a href="/designs" className="inline-flex min-h-[50px] items-center gap-2 rounded-full bg-[#1e6b3c] px-8 text-[15px] font-semibold text-white transition-all hover:bg-[#111111]" style={inter}>
              Discover design →
            </a>
          </div>
        </div>
      </section>
      <section className="bg-white pb-6 md:pb-10">
        <DesignCatalog />
      </section>
    </>
  );
}

function DesignCatalog() {
  const mono = { fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" } as const;
  const inter = { fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" } as const;
  return (
    <div className="mx-auto w-full max-w-6xl px-6">
      <Reveal delay={0.05}>
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:min-w-[78%] [&>*]:snap-start md:grid md:snap-none md:overflow-visible md:pb-0 md:[&>*]:min-w-0 md:grid-cols-3 lg:grid-cols-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e6b3c]">
          {DESIGN.map((s, i) => (
            <a key={`${s.name}-${i}`} href="/designs" className="group flex flex-col rounded-xl border border-black/[0.07] bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#1e6b3c]/35 hover:shadow-[0_18px_44px_-30px_rgba(17,17,17,0.3)]">
              <div className="flex items-center justify-between">
                <h3 className="text-[13.5px] font-semibold tracking-[-0.01em] text-[#111111]" style={inter}>{s.name}</h3>
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-black/10 text-[12px] text-[#111111]/60 transition-all group-hover:border-[#1e6b3c] group-hover:bg-[#1e6b3c] group-hover:text-white">→</span>
              </div>
              <ul className="mt-2.5 space-y-1">
                {s.items.map((it) => (<li key={it} className="text-[12px] leading-snug text-[#111111]/55" style={inter}>{it}</li>))}
              </ul>
            </a>
          ))}
        </div>
      </Reveal>
    </div>
  );
}


/* ---- anti-fatigue: collapsed chapter that mounts content only when opened ---- */
function ExpandSection({ title, blurb, children }: { title: string; blurb: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const sans = { fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" };
  return (
 <section className="">
      <button
        onClick={() => setOpen(!open)}
        className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-7 text-left transition-colors hover:bg-black/[0.015] md:py-9"
        aria-expanded={open}
        style={sans}
      >
        <span>
          <span className="block text-[19px] font-semibold tracking-[-0.02em] text-[#111111] md:text-[22px]">{title}</span>
          <span className="mt-1 block text-[14px] text-[#111111]/50">{blurb}</span>
        </span>
        <span
          className={`flex h-10 w-10 flex-none items-center justify-center rounded-full border border-black/[0.12] text-[#111111] transition-transform duration-300 ${open ? "rotate-45" : ""}`}
        >
          +
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-500 ${open ? "max-h-none opacity-100" : "max-h-0 opacity-0"}`}>
        {open && children}
      </div>
    </section>
  );
}

/* ---------- AI adoption — 100 businesses, 78 already running AI ---------- */
const ADOPTION: Array<[string, number]> = [
  ["Finance", 91],
  ["Marketing", 71],
  ["Healthcare", 66],
  ["Retail", 63],
  ["Manufacturing", 55],
];

function AdoptionSection() {
  const sans =
    "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif";
  const ref = useRef<HTMLElement | null>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") { setOn(true); return; }
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setOn(true), io.disconnect()), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} className="border-y border-black/[0.06] bg-[#FBFBFA] py-16 md:py-16" id="adoption">
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_minmax(0,470px)] lg:gap-16">
          {/* the argument */}
          <div>
            <p className="text-[12px] font-semibold tracking-[0.14em] text-[#1e6b3c] uppercase" style={{ fontFamily: sans }}>
              Adoption
            </p>
            <h2
              className="mt-5 max-w-xl text-[2rem] font-semibold leading-[1.06] tracking-[-0.045em] text-[#111111] sm:text-[2.6rem] md:text-[3.2rem]"
              style={{ fontFamily: sans }}
            >
              Out of any hundred businesses, seventy-eight already run AI.
            </h2>
            <p
              className="mt-5 max-w-lg text-[15px] leading-relaxed text-[#111111]/60 md:text-[16px]"
              style={{ fontFamily: sans }}
            >
              It is no longer a question of if. The twenty-two that haven't are not early
              — they are the ones their customers now compare against everybody else.
            </p>

            {/* the industry ledger */}
            <div className="mt-9 max-w-lg">
              {ADOPTION.map(([label, pct], i) => (
                <div
                  key={label}
                  className="flex items-center gap-4 border-b border-black/[0.07] py-3"
                  style={{ opacity: on ? 1 : 0, transition: `opacity .5s ease ${0.55 + i * 0.07}s` }}
                >
                  <span className="w-[108px] shrink-0 text-[13.5px] font-medium text-[#111111]/70" style={{ fontFamily: sans }}>
                    {label}
                  </span>
                  <span className="relative h-[6px] flex-1 overflow-hidden rounded-full bg-black/[0.06]">
                    <span
                      className="absolute inset-y-0 left-0 rounded-full bg-[#1e6b3c]"
                      style={{
                        width: on ? `${pct}%` : "0%",
                        transition: `width 1s cubic-bezier(.2,.8,.2,1) ${0.6 + i * 0.07}s`,
                      }}
                    />
                  </span>
                  <span
                    className="w-[46px] shrink-0 text-right text-[15px] font-semibold tabular-nums text-[#111111]"
                    style={{ fontFamily: sans }}
                  >
                    {pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* the grid, on its own plate so it reads as the centrepiece */}
          <div className="rounded-3xl border border-black/[0.08] bg-white p-7 shadow-[0_40px_90px_-60px_rgba(17,17,17,0.5)] md:p-9">
            <div className="flex items-end justify-between gap-4">
              <p
                className="text-[64px] leading-[0.85] font-semibold tracking-[-0.05em] text-[#1e6b3c] tabular-nums md:text-[80px]"
                style={{ fontFamily: sans }}
              >
                78<span className="text-[30px] align-top md:text-[38px]">%</span>
              </p>
              <p className="pb-1.5 text-right text-[12.5px] leading-snug text-[#111111]/50" style={{ fontFamily: sans }}>
                already run AI in at
                <br />
                least one function
              </p>
            </div>

            <div className="mt-7 grid w-full max-w-[330px] grid-cols-10 gap-[6px] md:gap-[7px]">
              {Array.from({ length: 100 }).map((_, i) => {
                const lit = i < 78;
                return (
                  <span
                    key={i}
                    className="aspect-square rounded-[4px]"
                    style={{
                      background: lit ? "#1e6b3c" : "transparent",
                      border: lit ? "none" : "1.5px solid rgba(180,84,58,0.35)",
                      boxShadow: lit ? "0 2px 6px -2px rgba(30,107,60,0.55)" : "none",
                      opacity: on ? 1 : 0,
                      transform: on ? "none" : "scale(0.3)",
                      transition: `opacity .4s ease ${i * 0.007}s, transform .45s cubic-bezier(.2,.9,.3,1.4) ${i * 0.007}s`,
                    }}
                  />
                );
              })}
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-black/[0.07] pt-5" style={{ fontFamily: sans }}>
              <span className="flex items-center gap-2.5 text-[13px] text-[#111111]/75">
                <span aria-hidden className="h-3 w-3 rounded-[3px] bg-[#1e6b3c]" />
                <b className="font-semibold text-[#111111]">78</b> running AI
              </span>
              <span className="flex items-center gap-2.5 text-[13px] text-[#111111]/60">
                <span aria-hidden className="h-3 w-3 rounded-[3px] border-[1.5px] border-[#b4543a]/40" />
                <b className="font-semibold text-[#b4543a]">22</b> falling behind
              </span>
            </div>
            <p className="mt-4 text-[11.5px] text-[#111111]/40" style={{ fontFamily: sans }}>
              Sources on the research page · Updated July 2026
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomeRows() {
  return (
    <main className="bg-white">
      <ScrollProgress />
      <HomeHero />
      <AdoptionSection />
      <AutomationSection />
      <AutomationCatalog />
      <DesignDivision />
      <SocialHomeSection />
      <DivisionRow
        n="3"
        title="Consultation"
        lede="We listen to your business first — strategy, technology, product, growth — then tell you exactly what to build."
        graphic={
          <div className="relative aspect-[3/2] w-full">
            <img
              src="/assets/consult/seating.png"
              alt=""
              width={1100}
              height={614}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-contain"
            />
          </div>
        }
        subs={[]}
        href="/consultation"
        cta="Book Consultation"
        extra={<ConsultPricing />}
      />
      <ExpandSection title="Proof — live systems and results" blurb="Real deployments, real numbers, why brands chose ELSIAA.">
        <HeroCards />
        <WhyBrandsChose />
        <SoftwareDemos />
      </ExpandSection>
      <ExpandSection title="The team" blurb="Who builds it, who stands behind it.">
        <Team />
      </ExpandSection>
      <ExpandSection title="Offices — six cities" blurb="New York, Los Angeles, London, Geneva, Antwerp, Tel Aviv.">
        <Locations />
      </ExpandSection>
      <FinalCTA />
      <StickyCTA />
    </main>
  );
}
