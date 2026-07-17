import { useEffect, useRef, useState } from "react";

/*
  ELSIAA designs opener — ONE page: the headline and the office cartoon live
  together on the same screen. 100% scroll-driven; no timers, no autoplay,
  no scroll hijacking.

    0.00-0.12  red strikethrough draws through "AI is just a nice tool...?";
               "The future is here." arrives — cartoon already on screen
    0.14-0.70  the film, scrubbed by scroll: he grabs the page, RIPS it out
               of the monitor, crumples it, throws it, it lands + settles
    0.70-0.84  landing caption: bad designs, where they belong
    0.84-1.00  camera dives into THE trash can, dissolving to white
*/

const TRACK_VH = 620;
const STILL_SRC = "/assets/office_scene_v8.jpeg";
const FILM_SRC = "/assets/destruction_v9.mp4";
const FILM_END_T = 14.9;

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
function seg(p: number, a: number, b: number) {
  return clamp01((p - a) / (b - a));
}

export function ElsiaaExperience() {
  const trackRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const strikeRef = useRef<SVGPathElement>(null);
  const futureRef = useRef<HTMLParagraphElement>(null);
  const videoWrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onMq = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onMq);
    return () => mq.removeEventListener("change", onMq);
  }, []);

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

      // strike draws, verdict lands — cartoon already sitting underneath
      const strikeP = seg(p, 0.02, 0.1);
      if (strike) strike.style.strokeDashoffset = `${strikeLen * (1 - strikeP)}`;
      if (futureRef.current) {
        const f = seg(p, 0.07, 0.13);
        futureRef.current.style.opacity = `${f}`;
        futureRef.current.style.transform = `translateY(${(1 - f) * 12}px)`;
      }

      // headline steps aside as the story takes over
      if (headRef.current) {
        const out = seg(p, 0.6, 0.72);
        headRef.current.style.opacity = `${1 - out}`;
        headRef.current.style.transform = `translateY(${out * -28}px)`;
      }

      // the film, scrubbed
      const film = seg(p, 0.14, 0.7);
      if (video && video.duration && Number.isFinite(video.duration)) {
        targetTime = film * Math.min(FILM_END_T, video.duration - 0.05);
      }

      // landing caption
      if (captionRef.current) {
        const eIn = seg(p, 0.7, 0.78);
        const e = eIn * (1 - seg(p, 0.86, 0.92));
        captionRef.current.style.opacity = `${e}`;
        captionRef.current.style.transform = `translateY(${(1 - eIn) * 18}px)`;
      }

      // the dive into THE trash can
      if (videoWrapRef.current) {
        const dive = seg(p, 0.84, 1);
        const dv = dive * dive * (3 - 2 * dive);
        const el = videoWrapRef.current;
        el.style.opacity = `${1 - seg(p, 0.965, 1)}`;
        el.style.transformOrigin = "72% 60%";
        el.style.transform = `scale(${1 + dv * 4.2})`;
        el.style.filter = `blur(${dv * 14}px)`;
      }

      raf = requestAnimationFrame(update);
    };

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

  if (reducedMotion) {
    return <StaticJourney />;
  }

  return (
    <div ref={trackRef} style={{ height: `${TRACK_VH}vh`, position: "relative" }}>
      <div className="sticky top-0 flex h-dvh w-full flex-col items-center overflow-hidden bg-white">
        {/* headline — same page as the cartoon */}
        <div
          ref={headRef}
          className="z-10 flex flex-col items-center px-6 pt-[9svh] text-center will-change-transform"
        >
          <h1 className="relative max-w-4xl text-3xl font-semibold leading-tight tracking-tight text-[#111111] md:text-6xl">
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
          <p
            ref={futureRef}
            className="mt-4 text-xl font-medium text-[#111111] opacity-0 md:text-2xl"
          >
            The future is here.
          </p>
        </div>

        {/* the film — on screen from the very first frame */}
        <div
          ref={videoWrapRef}
          className="absolute inset-0 flex items-end justify-center will-change-transform"
        >
          <video
            ref={videoRef}
            src={FILM_SRC}
            className="mb-[6svh] max-h-[62svh] w-auto max-w-[86vw] object-contain"
            muted
            playsInline
            preload="auto"
            poster={STILL_SRC}
          />
        </div>

        {/* landing caption */}
        <div
          ref={captionRef}
          className="pointer-events-none absolute inset-x-0 top-[10svh] z-10 flex flex-col items-center px-6 text-center opacity-0 will-change-transform"
        >
          <p
            className="text-3xl font-semibold tracking-[-0.02em] text-[#111111] md:text-5xl"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Bad designs, where they belong.
          </p>
          <p
            className="mt-3 text-lg text-[#111111]/55 md:text-xl"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Discover designs that convert strangers into customers.
          </p>
        </div>
      </div>
    </div>
  );
}

function StaticJourney() {
  return (
    <section className="flex min-h-dvh flex-col items-center justify-center gap-10 bg-white px-6 py-24 text-center">
      <h1 className="relative max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-[#111111] md:text-6xl">
        <span className="line-through decoration-[#E53E3E] decoration-8">
          AI is just a nice tool...?
        </span>
      </h1>
      <p className="text-2xl font-medium text-[#111111]">The future is here.</p>
      <img
        src={STILL_SRC}
        alt="A very frustrated, badly drawn office worker about to throw his website away"
        className="max-h-[50vh] w-auto max-w-[80vw] object-contain"
      />
      <p className="text-2xl font-semibold text-[#111111]">
        Bad designs, where they belong.
      </p>
    </section>
  );
}
