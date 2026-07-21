import { useEffect, useRef } from "react";

/*
  ELSIAA lion — a live animal in the header line.
  Behavior engine: he walks the full lane between the far left and the tabs
  icon, and every so often stops to be a lion — roars, lies down to rest,
  pounces — then carries on. All clips share the same white-background
  source lion; white is keyed out per-frame on canvas so he stands directly
  on the page. The whole lion is a button that returns home.
*/
const CLIPS = {
  walk: "/assets/lion_mesh_walk_v1.mp4",
  roar: "/assets/lion_mesh_roar_v1.mp4",
  rest: "/assets/lion_mesh_rest_v1.mp4",
  pounce: "/assets/lion_mesh_pounce_v1.mp4",
} as const;
type Mode = keyof typeof CLIPS;
const ACTIONS: Mode[] = ["roar", "rest", "pounce"];

export function LionWalker() {
  const wrapRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videosRef = useRef<Partial<Record<Mode, HTMLVideoElement>>>({});

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let raf = 0;
    let pos = 0;
    let dir = 1;
    let last = performance.now();
    let mode: Mode = "walk";
    let nextActionAt = performance.now() + 6000 + Math.random() * 8000;
    const SPEED = 24;

    const vids = videosRef.current;
    const active = () => vids[mode] ?? vids.walk;

    const startAction = (m: Mode) => {
      const v = vids[m];
      if (!v || v.readyState < 2) return; // clip not ready — stay walking
      mode = m;
      v.currentTime = 0;
      v.play().catch(() => {
        mode = "walk";
      });
      v.onended = () => {
        mode = "walk";
        vids.walk?.play().catch(() => {});
        nextActionAt = performance.now() + 7000 + Math.random() * 9000;
      };
    };

    const key = () => {
      const v = active();
      if (!v || v.readyState < 2) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(v, 0, 0, w, h);
      const frame = ctx.getImageData(0, 0, w, h);
      const d = frame.data;
      for (let i = 0; i < d.length; i += 4) {
        const min = Math.min(d[i], d[i + 1], d[i + 2]);
        if (min > 232) d[i + 3] = 0;
        else if (min > 200) d[i + 3] = ((232 - min) / 32) * 255;
      }
      ctx.putImageData(frame, 0, 0);
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
        if (now >= nextActionAt) {
          startAction(ACTIONS[Math.floor(Math.random() * ACTIONS.length)]);
        }
      }
      canvas.style.transform = `scaleX(${dir === 1 ? -1 : 1})`;
      key();
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-40" aria-hidden={false}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative ml-0 mr-[64px] h-[76px] md:mr-[560px]">
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
            <canvas ref={canvasRef} width={168} height={112} className="h-full w-full" />
          </button>
        </div>
      </div>
      {(Object.keys(CLIPS) as Mode[]).map((m) => (
        <video
          key={m}
          ref={(el) => {
            if (el) videosRef.current[m] = el;
          }}
          src={CLIPS[m]}
          autoPlay={m === "walk"}
          loop={m === "walk"}
          muted
          playsInline
          preload="auto"
          className="pointer-events-none fixed h-px w-px opacity-0"
        />
      ))}
    </div>
  );
}
