import { Component, type ReactNode, useEffect, useRef } from "react";

/*
  ELSIAA lion — lite engine.
  One video element, behavior clips swapped by src. White keyed on a small
  throttled canvas (20fps, 128px) so phones never sweat. Pauses when the
  tab is hidden. Wrapped in an error boundary: if anything inside fails,
  the lion simply disappears — the site never goes down with him.
*/
const CLIPS = {
  walk: "/assets/lion_mesh_walk_v1.mp4",
  roar: "/assets/lion_mesh_roar_v1.mp4",
  rest: "/assets/lion_mesh_rest_v1.mp4",
  pounce: "/assets/lion_mesh_pounce_v1.mp4",
} as const;
type Mode = keyof typeof CLIPS;
const ACTIONS: Mode[] = ["roar", "rest", "pounce"];

class LionBoundary extends Component<{ children: ReactNode }, { dead: boolean }> {
  state = { dead: false };
  static getDerivedStateFromError() {
    return { dead: true };
  }
  render() {
    return this.state.dead ? null : this.props.children;
  }
}

function LionEngine() {
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
    let lastKey = 0;
    let mode: Mode = "walk";
    let nextActionAt = performance.now() + 8000 + Math.random() * 8000;
    const SPEED = 24;
    const KEY_INTERVAL = 50; // ms → 20fps keying

    const setClip = (m: Mode) => {
      mode = m;
      video.loop = m === "walk";
      video.src = CLIPS[m];
      video.currentTime = 0;
      video.play().catch(() => {
        if (m !== "walk") setClip("walk");
      });
    };
    video.onended = () => {
      if (mode !== "walk") {
        setClip("walk");
        nextActionAt = performance.now() + 9000 + Math.random() * 9000;
      }
    };
    setClip("walk");

    const key = (now: number) => {
      if (now - lastKey < KEY_INTERVAL || video.readyState < 2) return;
      lastKey = now;
      try {
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(video, 0, 0, w, h);
        const frame = ctx.getImageData(0, 0, w, h);
        const d = frame.data;
        for (let i = 0; i < d.length; i += 4) {
          const min = Math.min(d[i], d[i + 1], d[i + 2]);
          if (min > 232) d[i + 3] = 0;
          else if (min > 200) d[i + 3] = ((232 - min) / 32) * 255;
        }
        ctx.putImageData(frame, 0, 0);
      } catch {
        /* drawing hiccup — skip frame */
      }
    };

    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (mode === "walk") {
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
        if (now >= nextActionAt && video.readyState >= 2) {
          setClip(ACTIONS[Math.floor(Math.random() * ACTIONS.length)]);
        }
      }
      canvas.style.transform = `scaleX(${dir === 1 ? -1 : 1})`;
      key(now);
      raf = requestAnimationFrame(step);
    };

    const onVis = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        video.pause();
      } else {
        video.play().catch(() => {});
        last = performance.now();
        raf = requestAnimationFrame(step);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
      video.onended = null;
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-40" aria-hidden={false}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative ml-0 mr-[64px] h-[76px] md:mr-[720px]">
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
            <canvas ref={canvasRef} width={128} height={86} className="h-full w-full" />
          </button>
        </div>
      </div>
      <video
        ref={videoRef}
        muted
        playsInline
        preload="auto"
        className="pointer-events-none fixed h-px w-px opacity-0"
      />
    </div>
  );
}

export function LionWalker() {
  return (
    <LionBoundary>
      <LionEngine />
    </LionBoundary>
  );
}
