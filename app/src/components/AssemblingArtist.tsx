import { useEffect, useRef, useState } from "react";

/*
  Design division graphic — the holographic artist, white studio.
  Scroll-triggered: when the block scrolls into view, the scene assembles
  from green particles (plays once). When assembly completes, it comes
  alive — the artist works the hologram on a seamless loop.
  The white footage sits on a white surface with mix-blend-multiply, so it
  auto-adapts if the visitor's system is in dark mode (white becomes the
  surface color). Default is light.
*/
export function AssemblingArtist() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const asmRef = useRef<HTMLVideoElement>(null);
  const [alive, setAlive] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    const asm = asmRef.current;
    if (!wrap || !asm) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setStarted(true);
          asm.play().catch(() => setAlive(true));
          io.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(wrap);

    const onEnded = () => setAlive(true);
    asm.addEventListener("ended", onEnded);
    return () => {
      io.disconnect();
      asm.removeEventListener("ended", onEnded);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl bg-white dark:bg-[#0c0c0c]"
    >
      {/* assemble phase — plays once when scrolled into view */}
      <video
        ref={asmRef}
        src="/assets/artist_assemble_v2.mp4"
        muted
        playsInline
        preload="auto"
        className={`absolute inset-0 h-full w-full object-cover mix-blend-multiply transition-opacity duration-500 ${
          alive ? "opacity-0" : started ? "opacity-100" : "opacity-0"
        }`}
      />
      {/* alive phase — looping while resting in view */}
      {alive && (
        <video
          src="/assets/artist_idle_v2.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover mix-blend-multiply"
        />
      )}
    </div>
  );
}
