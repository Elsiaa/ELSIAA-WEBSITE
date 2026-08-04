import { useEffect, useRef, useState } from "react";

/*
  ELSIAA designs opener — ONE page: the headline and the office cartoon live
  together on the same screen. 100% scroll-driven; no timers, no autoplay,
  no scroll hijacking.

    0.06-0.86  the film, scrubbed by scroll: he grabs the page, RIPS it out
               of the monitor, crumples it, throws it, it lands + settles
    0.70-0.84  landing caption: bad designs, where they belong
    0.72-1.00  the settled shot holds
*/

const TRACK_VH = 420;
const STILL_SRC = "/assets/destruction_v11_still.jpg";
const FILM_SRC =
  typeof window !== "undefined" && window.innerWidth < 768
    ? "/assets/destruction_v11_lite.mp4"
    : "/assets/destruction_v11.mp4";
const FILM_END_T = 9.9;

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
function seg(p: number, a: number, b: number) {
  return clamp01((p - a) / (b - a));
}

export function ElsiaaExperience() {
  const trackRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const videoWrapRef = useRef<HTMLDivElement>(null);
  const shockRef = useRef<HTMLDivElement>(null);
  const capRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const timeRef = useRef<HTMLDivElement>(null);
  const timeBarRef = useRef<HTMLDivElement>(null);
  const timeLabelRef = useRef<HTMLSpanElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
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

    // pointer-reactive 3D stage tilt
    let tiltX = 0;
    let tiltY = 0;
    let curX = 0;
    let curY = 0;
    const onPointer = (e: PointerEvent) => {
      tiltY = (e.clientX / window.innerWidth - 0.5) * 5;
      tiltX = -(e.clientY / window.innerHeight - 0.5) * 4;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    let raf = 0;
    let targetTime = 0;

    const update = () => {
      const rect = track.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const p = clamp01(-rect.top / total);

      // the headline and the cartoon live together the whole way through — the
      // title stays put so the frozen final frame is exactly the screenshot:
      // headline above, settled illustration below, on pure white.
      if (titleRef.current) {
        titleRef.current.style.opacity = "1";
        titleRef.current.style.transform = "none";
      }

      // the film, scrubbed
      const film = seg(p, 0.06, 0.74);
      if (video && video.duration && Number.isFinite(video.duration)) {
        targetTime = film * Math.min(FILM_END_T, video.duration - 0.05);
      }

      // captions — three beats, timed to the film
      const CAPS: [number, number][] = [
        [0.14, 0.3],
        [0.36, 0.52],
        [0.56, 0.72],
      ];
      capRefs.current.forEach((el, i) => {
        if (!el) return;
        const [a, b] = CAPS[i];
        const eIn = seg(p, a, a + 0.05);
        const eOut = 1 - seg(p, b - 0.04, b);
        const e = Math.min(eIn, eOut);
        el.style.opacity = `${e}`;
        el.style.transform = `translateY(${(1 - eIn) * 22}px)`;
      });

      // cinema: slow dolly-in across the whole scrub
      const dolly = 1 + film * 0.12;

      // impact: the landing hits — shockwave ring + camera shake
      const impact = seg(p, 0.66, 0.74);
      const shake =
        impact > 0 && impact < 1
          ? Math.sin(p * 900) * 7 * Math.sin(impact * Math.PI)
          : 0;
      if (shockRef.current) {
        const ring = seg(p, 0.68, 0.8);
        shockRef.current.style.opacity = `${ring > 0 ? (1 - ring) * 0.75 : 0}`;
        shockRef.current.style.transform = `translate(-50%, -50%) scale(${0.2 + ring * 3.4})`;
      }

      // editor timecode under the film
      if (timeBarRef.current) timeBarRef.current.style.transform = `scaleX(${film})`;
      if (timeLabelRef.current) {
        const t = film * 14.9;
        timeLabelRef.current.textContent = `00:${String(Math.floor(t)).padStart(2, "0")}.${String(Math.floor((t % 1) * 10))}`;
      }
      if (timeRef.current) {
        timeRef.current.style.opacity = `${seg(p, 0.04, 0.1) * (1 - seg(p, 0.76, 0.82))}`;
      }

      // living 3D depth — the scene settles into a LOCKED final frame and holds
      // there. No fade-out, no blur, no cross-fade to a "premium render": the
      // ending stays exactly on the settled shot. The pointer tilt eases to zero
      // over the last stretch so the final state is a still, framed picture.
      curX += (tiltX - curX) * 0.06;
      curY += (tiltY - curY) * 0.06;
      const settle = 1 - seg(p, 0.9, 1);
      if (videoWrapRef.current) {
        const el = videoWrapRef.current;
        el.style.transform = `translateX(${shake}px) rotateX(${curX * settle}deg) rotateY(${curY * settle}deg) scale(${dolly})`;
        el.style.opacity = "1";
        el.style.filter = "none";
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
      window.removeEventListener("pointermove", onPointer);
    };
  }, [reducedMotion]);

  if (reducedMotion) {
    return <StaticJourney />;
  }

  return (
    <div ref={trackRef} style={{ height: `${TRACK_VH}vh`, position: "relative", zIndex: 10 }}>
      <div
        className="sticky top-0 flex h-dvh w-full flex-col items-center overflow-hidden bg-white"
        style={{ perspective: "1200px" }}
      >
        {/* welcome — discover designs */}
        <div
          ref={titleRef}
          className="z-10 flex flex-col items-center px-6 pt-[10svh] text-center will-change-transform"
        >
          <p
            className="text-[13px] text-[#1e6b3c] "
            style={{ fontFamily: "var(--font-sans)" }}
          >
            The ELSIAA signature
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
            className="mb-[3svh] max-h-[76svh] w-auto max-w-[96vw] object-contain"
            muted
            playsInline
            preload="auto"
            poster={STILL_SRC}
          />
          {/* impact shockwave, centered on the can */}
          <div
            ref={shockRef}
            aria-hidden
            className="pointer-events-none absolute rounded-full border-[3px] border-[#111111]/70"
            style={{ left: "68%", top: "58%", width: "16vmin", height: "16vmin", opacity: 0, transform: "translate(-50%, -50%) scale(0.2)" }}
          />
        </div>

      </div>
    </div>
  );
}

function StaticJourney() {
  return (
    <section className="flex min-h-dvh flex-col items-center justify-center gap-10 bg-white px-6 py-10 md:py-16 text-center">
      <img
        src={STILL_SRC}
        alt="Bad design being torn right out of the screen"
        className="max-h-[50vh] w-auto max-w-[80vw] object-contain"
      />
    </section>
  );
}
