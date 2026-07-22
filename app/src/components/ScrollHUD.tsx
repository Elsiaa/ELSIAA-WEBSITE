import { useEffect, useRef } from "react";

/*
  2030 workflow rail — a live pipeline HUD pinned to the left edge.
  Tracks the visitor's position through the page's acts with a filling
  spine, active-stage glow, and a live percentage readout. Desktop only.
*/

const STAGES = [
  { id: "01", label: "Problem" },
  { id: "02", label: "Evolution" },
  { id: "03", label: "Proof" },
  { id: "04", label: "Craft" },
  { id: "05", label: "Work" },
];

export function ScrollHUD() {
  const spineRef = useRef<HTMLDivElement | null>(null);
  const pctRef = useRef<HTMLSpanElement | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const tick = () => {
      const doc = document.documentElement;
      const total = Math.max(1, doc.scrollHeight - window.innerHeight);
      const p = Math.min(1, Math.max(0, window.scrollY / total));
      if (spineRef.current) spineRef.current.style.transform = `scaleY(${p})`;
      if (pctRef.current) pctRef.current.textContent = `${String(Math.round(p * 100)).padStart(2, "0")}%`;
      const active = Math.min(STAGES.length - 1, Math.floor(p * STAGES.length));
      itemRefs.current.forEach((el, i) => {
        if (!el) return;
        el.style.opacity = i === active ? "1" : "0.32";
        el.style.transform = i === active ? "translateX(4px)" : "none";
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <aside
      aria-hidden
      className="pointer-events-none fixed top-1/2 left-6 z-40 hidden -translate-y-1/2 mix-blend-difference lg:block"
    >
      <div className="flex items-stretch gap-4">
        <div className="relative w-px bg-white/20">
          <div
            ref={spineRef}
            className="absolute inset-x-0 top-0 h-full origin-top bg-[#2e9e58]"
            style={{ transform: "scaleY(0)" }}
          />
        </div>
        <div className="flex flex-col justify-between gap-5 py-1">
          {STAGES.map((s, i) => (
            <div
              key={s.id}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              className="flex items-baseline gap-2 transition-all duration-500"
              style={{ opacity: 0.32 }}
            >
              <span
                className="text-[10px] text-[#2e9e58]"
                style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
              >
                {s.id}
              </span>
              <span
                className="text-[10px] tracking-[0.3em] text-white uppercase"
                style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
              >
                {s.label}
              </span>
            </div>
          ))}
          <span
            ref={pctRef}
            className="mt-1 text-[10px] text-white/50"
            style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
          >
            00%
          </span>
        </div>
      </div>
    </aside>
  );
}
