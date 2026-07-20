import { useEffect, useRef, useState } from "react";

/*
  Design division graphic — the holographic artist.
  Phase 1: as the block scrolls into view, the scene assembles from
  particles (scroll-scrubbed, all-keyframe encode).
  Phase 2: once fully assembled and resting in view, it comes alive —
  the artist works the hologram on a seamless loop.
*/
const ASM_END = 4.9;

export function AssemblingArtist() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const asmRef = useRef<HTMLVideoElement>(null);
  const [alive, setAlive] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    const asm = asmRef.current;
    if (!wrap || !asm) return;
    asm.pause();

    let raf = 0;
    let target = 0;
    let current = 0;
    let liveNow = false;

    const onScroll = () => {
      const r = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      // progress 0 → 1 while the block travels from entering to ~55% up the viewport
      const p = Math.min(Math.max((vh - r.top) / (vh * 0.75), 0), 1);
      target = p * ASM_END;
      const done = p >= 0.999;
      if (done !== liveNow) {
        liveNow = done;
        setAlive(done);
      }
    };

    const tick = () => {
      current += (target - current) * 0.18;
      if (Math.abs(current - target) > 0.004 && asm.readyState >= 2) {
        try {
          asm.currentTime = current;
        } catch {
          /* seek not ready */
        }
      }
      raf = requestAnimationFrame(tick);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl bg-[#050705]"
    >
      {/* assemble phase — scrubbed */}
      <video
        ref={asmRef}
        src="/assets/artist_assemble_v1.mp4"
        muted
        playsInline
        preload="auto"
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
          alive ? "opacity-0" : "opacity-100"
        }`}
      />
      {/* alive phase — looping */}
      {alive && (
        <video
          src="/assets/artist_idle_v1.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  );
}
