import { useEffect, useRef } from "react";

/*
  ELSIAA lion — lives inside the header line itself, pacing between the
  wordmark and the tabs icon. The white background of the walk-cycle video
  is keyed out per-frame on a small canvas, so the lion walks directly on
  whatever is behind the header — no capsule, no box. Clicking him goes home.
*/
export function LionWalker() {
  const wrapRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!wrap || !canvas || !video) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let raf = 0;
    let pos = 0;
    let dir = 1;
    let last = performance.now();
    const SPEED = 26;

    const key = () => {
      if (video.readyState >= 2) {
        const w = canvas.width;
        const h = canvas.height;
        ctx.drawImage(video, 0, 0, w, h);
        const frame = ctx.getImageData(0, 0, w, h);
        const d = frame.data;
        for (let i = 0; i < d.length; i += 4) {
          const min = Math.min(d[i], d[i + 1], d[i + 2]);
          // pure white → transparent; soft falloff keeps fur edges
          if (min > 232) d[i + 3] = 0;
          else if (min > 200) d[i + 3] = ((232 - min) / 32) * 255;
        }
        ctx.putImageData(frame, 0, 0);
      }
    };

    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const bound = Math.max(
        (wrap.parentElement?.clientWidth ?? 300) - wrap.clientWidth,
        10
      );
      pos += dir * SPEED * dt;
      if (pos >= bound) {
        pos = bound;
        dir = -1;
      } else if (pos <= 0) {
        pos = 0;
        dir = 1;
      }
      wrap.style.transform = `translateX(${pos}px)`;
      canvas.style.transform = `scaleX(${dir === 1 ? -1 : 1})`;
      key();
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-40"
      aria-hidden={false}
    >
      <div className="mx-auto max-w-6xl px-6">
        {/* the walking lane: starts after the wordmark, ends before the tabs icon */}
        <div className="relative ml-[200px] mr-[72px] h-[76px] md:ml-[260px] md:mr-[220px]">
          <button
            ref={wrapRef}
            onClick={() => {
              window.location.href = "/";
            }}
            aria-label="ELSIAA — return to the home page"
            title="Home"
            className="pointer-events-auto absolute bottom-1 left-0 h-[56px] w-[84px] cursor-pointer border-0 bg-transparent p-0 md:h-[64px] md:w-[96px]"
            style={{ willChange: "transform" }}
          >
            <canvas
              ref={canvasRef}
              width={168}
              height={112}
              className="h-full w-full"
            />
          </button>
        </div>
      </div>
      <video
        ref={videoRef}
        src="/assets/lion_walk_v1.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="pointer-events-none fixed h-px w-px opacity-0"
      />
    </div>
  );
}
