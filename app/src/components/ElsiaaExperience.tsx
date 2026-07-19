import { useEffect, useRef, useState } from "react";

/*
  ELSIAA designs opener — ONE page: the headline and the office cartoon live
  together on the same screen. 100% scroll-driven; no timers, no autoplay,
  no scroll hijacking.

    0.06-0.72  the film, scrubbed by scroll: he grabs the page, RIPS it out
               of the monitor, crumples it, throws it, it lands + settles
    0.70-0.84  landing caption: bad designs, where they belong
    0.72-1.00  the settled shot holds
*/

const TRACK_VH = 540;
const STILL_SRC = "/assets/office_scene_v8.jpeg";
const FILM_SRC =
  typeof window !== "undefined" && window.innerWidth < 768
    ? "/assets/destruction_v9_lite.mp4"
    : "/assets/destruction_v9.mp4";
const FILM_END_T = 14.9;

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
function seg(p: number, a: number, b: number) {
  return clamp01((p - a) / (b - a));
}

export function ElsiaaExperience() {
  const trackRef = useRef<HTMLDivElement>(null);
  const videoWrapRef = useRef<HTMLDivElement>(null);
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

      // the film, scrubbed
      const film = seg(p, 0.06, 0.72);
      if (video && video.duration && Number.isFinite(video.duration)) {
        targetTime = film * Math.min(FILM_END_T, video.duration - 0.05);
      }

      // living 3D depth
      curX += (tiltX - curX) * 0.06;
      curY += (tiltY - curY) * 0.06;
      if (videoWrapRef.current) {
        const el = videoWrapRef.current;
        el.style.transform = `rotateX(${curX}deg) rotateY(${curY}deg)`;
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
        {/* 2030 stage floor — receding dot grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-[-20%] bottom-[-6%] h-[46%]"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(30,107,60,0.22) 1px, transparent 1.5px)",
            backgroundSize: "26px 26px",
            transform: "rotateX(64deg)",
            transformOrigin: "bottom center",
            maskImage: "linear-gradient(to top, rgba(0,0,0,0.55), transparent 85%)",
            WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.55), transparent 85%)",
          }}
        />
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

      </div>
    </div>
  );
}

function StaticJourney() {
  return (
    <section className="flex min-h-dvh flex-col items-center justify-center gap-10 bg-white px-6 py-24 text-center">
      <img
        src={STILL_SRC}
        alt="A very frustrated, badly drawn office worker about to throw his website away"
        className="max-h-[50vh] w-auto max-w-[80vw] object-contain"
      />
    </section>
  );
}
