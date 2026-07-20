import { useEffect, useRef } from "react";

/*
  ELSIAA lion — hyperrealistic walk cycle, paces back and forth along the
  top of the page. The whole thing is a button that returns home.
  Video has a pure white background and sits on a white strip with
  mix-blend-multiply, so it composites seamlessly. The walking bounds are
  clamped to (strip width − lion width), so the lion can never be cut off.
*/
export function LionWalker() {
  const stripRef = useRef<HTMLDivElement>(null);
  const lionRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const strip = stripRef.current;
    const lion = lionRef.current;
    if (!strip || !lion) return;

    let pos = 8; // float accumulator — Safari-safe
    let dir = 1; // 1 → walking right, -1 → walking left
    let raf = 0;
    let last = performance.now();
    const SPEED = 42; // px per second — slow, regal

    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const max = Math.max(strip.clientWidth - lion.clientWidth - 8, 8);
      pos += dir * SPEED * dt;
      if (pos >= max) {
        pos = max;
        dir = -1;
      } else if (pos <= 8) {
        pos = 8;
        dir = 1;
      }
      // source video faces left → mirror when walking right
      lion.style.transform = `translateX(${pos}px) scaleX(${dir === 1 ? -1 : 1})`;
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={stripRef}
      className="pointer-events-none relative w-full overflow-visible bg-white"
      style={{ height: "clamp(72px, 12vw, 130px)" }}
      aria-hidden={false}
    >
      <button
        ref={lionRef}
        onClick={() => {
          window.location.href = "/";
        }}
        aria-label="ELSIAA — return to the home page"
        title="Home"
        className="pointer-events-auto absolute bottom-0 left-0 h-full cursor-pointer border-0 bg-transparent p-0 transition-[filter] duration-300 hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2e9e58]"
        style={{ willChange: "transform" }}
      >
        <video
          ref={videoRef}
          src="/assets/lion_walk_v1.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-auto select-none mix-blend-multiply"
          draggable={false}
        />
      </button>
    </div>
  );
}
