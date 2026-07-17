import { useEffect, useRef, useState } from "react";

/*
  ELSIAA scroll journey — 100% scroll-driven. No timers, no autoplay, no
  scroll hijacking. Your scroll position IS the timeline:

    0.00-0.14  hero: "AI is just a nice tool...?"
    0.14-0.26  red strikethrough draws itself; "The future is here."
    0.26-0.40  hero shrinks away; the MS Paint office fades in — the guy is
               sitting at his desk, the SAME page on his monitor
    0.40-0.76  the film, scrubbed frame-by-frame by scroll: he grabs the page,
               RIPS it out of the monitor, crumples it, throws it, and it
               lands and settles in the trash — all of it under your finger
    0.76-0.86  hold: the settled ball-in-trash shot stays on screen while you
               keep scrolling (pure scroll distance, nothing is locked)
    0.74-0.88  landing caption over the settled shot\n    0.86-1.00  camera dives into THE trash can, dissolving to white
  Then normal scroll: services, CTA, footer.
  All browser APIs live inside useEffect (SSR-safe).
*/

const TRACK_VH = 700;
const STILL_SRC = "/assets/office_scene_v8.jpeg";
const FILM_SRC = "/assets/destruction_v9.mp4";
const FILM_END_T = 14.9; // scrub through the FULL film: rip, throw, land, settle

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
function seg(p: number, a: number, b: number) {
  return clamp01((p - a) / (b - a));
}

export function ElsiaaExperience() {
  const trackRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const strikeRef = useRef<SVGPathElement>(null);
  const futureRef = useRef<HTMLParagraphElement>(null);
  const exploreRef = useRef<HTMLButtonElement>(null);
  const officeRef = useRef<HTMLDivElement>(null);
  const videoWrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const resetRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onMq = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onMq);
    return () => mq.removeEventListener("change", onMq);
  }, []);

  // --- master scroll driver: scroll position -> everything -------------------
  useEffect(() => {
    if (reducedMotion) return;
    const track = trackRef.current;
    const video = videoRef.current;
    if (!track) return;

    let raf = 0;
    let targetTime = 0;

    const strike = strikeRef.current;
    const strikeLen = strike ? strike.getTotalLength() : 0;
    if (strike) {
      strike.style.strokeDasharray = `${strikeLen}`;
      strike.style.strokeDashoffset = `${strikeLen}`;
    }

    const update = () => {
      const rect = track.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const p = clamp01(-rect.top / total);


      // hero + strike
      const strikeP = seg(p, 0.14, 0.24);
      if (strike) strike.style.strokeDashoffset = `${strikeLen * (1 - strikeP)}`;
      if (futureRef.current) {
        futureRef.current.style.transform = `translateY(${(1 - seg(p, 0.18, 0.26)) * 14}px)`;
        futureRef.current.style.opacity = `${seg(p, 0.18, 0.26)}`;
      }
      if (exploreRef.current) {
        exploreRef.current.style.opacity = `${1 - seg(p, 0.14, 0.2)}`;
        exploreRef.current.style.pointerEvents = p > 0.16 ? "none" : "auto";
      }

      // morph: hero out, office still in
      const morph = seg(p, 0.26, 0.4);
      if (heroRef.current) {
        const s = 1 - morph * 0.82;
        heroRef.current.style.transform = `scale(${s}) translateY(${morph * -6}vh)`;
        heroRef.current.style.opacity = `${1 - seg(p, 0.36, 0.42)}`;
      }
      if (officeRef.current) {
        officeRef.current.style.opacity = `${seg(p, 0.3, 0.4) * (1 - seg(p, 0.4, 0.44))}`;
        officeRef.current.style.transform = `scale(${1.06 - seg(p, 0.3, 0.42) * 0.06})`;
      }

      // the film: scroll scrubs the WHOLE thing — rip, crumple, throw,
      // land, settle. From p 0.76 the settled ball-in-trash shot stays on
      // screen while the landing caption fades in over it.
      const film = seg(p, 0.4, 0.72);
      if (video && video.duration && Number.isFinite(video.duration)) {
        targetTime = film * Math.min(FILM_END_T, video.duration - 0.05);
      }

      // landing caption: bad designs where they belong
      if (resetRef.current) {
        const e = seg(p, 0.74, 0.82) * (1 - seg(p, 0.88, 0.94));
        resetRef.current.style.opacity = `${e}`;
        resetRef.current.style.transform = `translateY(${(1 - seg(p, 0.74, 0.82)) * 18}px)`;
      }

      // the dive: camera plunges into THE trash can — the same one he threw
      // into — scaling the settled shot up around the can until it fills
      // everything, dissolving to white as the world takes over
      if (videoWrapRef.current) {
        const dive = seg(p, 0.86, 1);
        const dv = dive * dive * (3 - 2 * dive); // smoothstep
        const el = videoWrapRef.current;
        el.style.opacity = `${seg(p, 0.4, 0.44) * (1 - seg(p, 0.965, 1))}`;
        el.style.transformOrigin = "72% 60%";
        el.style.transform = `scale(${1 + dv * 4.2})`;
        el.style.filter = `blur(${dv * 14}px)`;
      }
      raf = requestAnimationFrame(update);
    };

    // eased seek toward the scroll-determined time — still purely
    // scroll-driven; never issue a new seek while one is in flight,
    // otherwise the decoder queue floods and the page freezes
    let seekRaf = 0;
    const seekLoop = () => {
      if (
        video &&
        video.readyState >= 2 &&
        !video.seeking &&
        Number.isFinite(video.duration)
      ) {
        const cur = video.currentTime;
        const diff = targetTime - cur;
        if (Math.abs(diff) > 0.034) {
          // step at most ~0.5s per seek so reversals stay responsive
          const step = Math.max(-0.5, Math.min(0.5, diff * 0.5));
          video.currentTime = cur + step;
        }
      }
      seekRaf = requestAnimationFrame(seekLoop);
    };

    raf = requestAnimationFrame(update);
    seekRaf = requestAnimationFrame(seekLoop);
    if (video) {
      video.pause();
      video.load();
      const prime = () => {
        video.currentTime = 0.001;
        video.removeEventListener("loadedmetadata", prime);
      };
      video.addEventListener("loadedmetadata", prime);
    }
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(seekRaf);
    };
  }, [reducedMotion]);

  const scrollToServices = () => {
    document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
  };

  if (reducedMotion) {
    return <StaticJourney />;
  }

  return (
    <div ref={trackRef} style={{ height: `${TRACK_VH}vh`, position: "relative" }}>
      <div className="sticky top-0 h-dvh w-full overflow-hidden bg-white">
        {/* hero */}
        <div
          ref={heroRef}
          className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center will-change-transform"
          style={{ transformOrigin: "50% 42%" }}
        >
          <h1 className="relative max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-[#111111] md:text-7xl">
            AI is just a nice tool...?
            <svg
              className="pointer-events-none absolute left-[-2%] top-1/2 h-[0.5em] w-[104%] -translate-y-1/2"
              viewBox="0 0 1000 60"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                ref={strikeRef}
                d="M8 38 C 180 22, 340 44, 500 30 S 830 40, 992 24"
                fill="none"
                stroke="#E53E3E"
                strokeWidth="9"
                strokeLinecap="round"
              />
            </svg>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-neutral-500 md:text-xl">
            Global presence. Cutting-edge solutions.
          </p>
          <p
            ref={futureRef}
            className="mt-8 text-2xl font-medium text-[#111111] opacity-0 md:text-3xl"
          >
            The future is here.
          </p>
          <button
            ref={exploreRef}
            onClick={scrollToServices}
            className="mt-10 rounded-full border border-neutral-300 px-8 py-3 text-sm font-medium text-neutral-700 transition-colors hover:border-[#1e6b3c] hover:text-[#1e6b3c]"
          >
            Explore
          </button>
        </div>

        {/* MS Paint office still — the guy at his desk, the page on his monitor */}
        <div
          ref={officeRef}
          className="absolute inset-0 flex items-center justify-center bg-white opacity-0 will-change-transform"
        >
          <img
            src={STILL_SRC}
            alt="A very frustrated, very badly drawn office worker staring at the crossed-out webpage on his monitor"
            className="max-h-[56vh] w-auto max-w-[72vw] object-contain"
            loading="eager"
          />
        </div>

        {/* the film: rip it out, crumple, throw, land, settle — scrubbed by scroll */}
        <div
          ref={videoWrapRef}
          className="absolute inset-0 flex items-center justify-center bg-white opacity-0"
        >
          <video
            ref={videoRef}
            src={FILM_SRC}
            className="max-h-[56vh] w-auto max-w-[72vw] object-contain"
            muted
            playsInline
            preload="auto"
            poster={STILL_SRC}
          />
        </div>

        {/* landing caption — bad designs where they belong */}
        <div
          ref={resetRef}
          className="pointer-events-none absolute inset-x-0 bottom-[8svh] flex flex-col items-center px-6 text-center opacity-0 will-change-transform"
        >
          <p
            className="text-3xl font-semibold tracking-[-0.02em] text-[#111111] md:text-6xl"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Bad designs, where they belong.
          </p>
          <p
            className="mt-4 text-lg text-[#111111]/55 md:text-2xl"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Discover designs that convert strangers into customers.
          </p>
        </div>
      </div>
    </div>
  );
}

/* Reduced-motion fallback: the story as a static stack */
function StaticJourney() {
  return (
    <div className="bg-white">
      <section className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
        <h1 className="relative max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-[#111111] md:text-6xl">
          <span className="relative inline-block">
            AI is just a nice tool...?
            <span className="absolute left-0 top-1/2 h-[6px] w-full -translate-y-1/2 rounded bg-[#E53E3E]" />
          </span>
        </h1>
        <p className="mt-6 text-2xl font-medium text-[#111111]">The future is here.</p>
      </section>
      <section className="mx-auto max-w-3xl px-6 pb-24">
        <img
          src={STILL_SRC}
          alt="A very badly drawn office worker losing patience with a failing website"
          className="w-full"
        />
      </section>
    </div>
  );
}
