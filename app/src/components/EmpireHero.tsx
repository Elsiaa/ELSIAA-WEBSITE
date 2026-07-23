import { useEffect, useRef, useState } from "react";

const CITIES = "Antwerp · Geneva · London · Tel Aviv · New York · Los Angeles";

// scroll track length for the turn sequence, in vh beyond the first screen
const TURN_VH = 260;
const TURN_SRC = "/assets/lion_turn_v1.mp4";
const TURN_END_T = 9.9;

export function EmpireHero() {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const idleRef = useRef<HTMLVideoElement | null>(null);
  const turnRef = useRef<HTMLVideoElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    const track = trackRef.current;
    const idle = idleRef.current;
    const turn = turnRef.current;
    const text = textRef.current;
    if (!track || !idle || !turn || !text) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return; // idle cinemagraph only

    turn.load();

    let targetTime = 0;
    let raf = 0;

    const update = () => {
      const r = track.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, total)));

      // words dissolve first
      const textFade = Math.min(1, p / 0.12);
      text.style.opacity = String((1 - textFade) * 1);
      text.style.transform = `translateY(${textFade * -24}px)`;

      // crossfade idle cinemagraph -> scrubbed turn film
      const cross = Math.min(1, Math.max(0, (p - 0.02) / 0.08));
      idle.style.opacity = String(0.55 * (1 - cross));
      turn.style.opacity = String(cross);
      if (cross >= 1 && !idle.paused) idle.pause();
      if (cross < 1 && idle.paused) idle.play().catch(() => {});

      // scrub the 180° pull-back turn across the rest of the track
      const film = Math.min(1, Math.max(0, (p - 0.1) / 0.9));
      targetTime = film * Math.min(TURN_END_T, (turn.duration || TURN_END_T) - 0.05);

      raf = requestAnimationFrame(update);
    };

    // guarded seek loop — never issue a new seek while one is in flight
    let seekRaf = 0;
    const seekLoop = () => {
      if (
        turn.readyState >= 2 &&
        !turn.seeking &&
        Number.isFinite(turn.duration)
      ) {
        const cur = turn.currentTime;
        const diff = targetTime - cur;
        if (Math.abs(diff) > 0.034) {
          const step = Math.max(-0.5, Math.min(0.5, diff * 0.5));
          turn.currentTime = cur + step;
        }
      }
      seekRaf = requestAnimationFrame(seekLoop);
    };

    raf = requestAnimationFrame(update);
    seekRaf = requestAnimationFrame(seekLoop);
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(seekRaf);
    };
  }, []);

  return (
    <div ref={trackRef} style={{ height: `calc(100svh + ${TURN_VH}vh)` }} className="relative bg-[#070907]">
      <section className="sticky top-0 flex h-[100svh] flex-col items-center justify-center overflow-hidden bg-[#070907] text-[#F5F5F3]">
        {/* idle breathing lion */}
        <video
          ref={idleRef}
          src="/assets/lion_alive_v1.mp4"
          poster="/assets/lion_real_v1.jpg"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-[1600ms]"
          style={{ opacity: ready ? 0.55 : 0 }}
        />
        {/* scroll-scrubbed pull-back + 180° turn */}
        <video
          ref={turnRef}
          src={TURN_SRC}
          muted
          playsInline
          preload="auto"
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          style={{ opacity: 0 }}
        />
        {/* vignette so type always sits on near-black */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(7,9,7,0.25)_0%,rgba(7,9,7,0.78)_78%,rgba(7,9,7,0.95)_100%)]" />

        <div ref={textRef} className="relative z-10 flex flex-col items-center px-6 text-center">
          <p
            className="mb-6 text-[13px] text-[#2e9e58] "
            style={{
              fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif",
              opacity: ready ? 1 : 0,
              transition: "opacity 1.2s ease 0.2s",
            }}
          >
            ELSIAA
          </p>
          <h1
            className="max-w-4xl text-5xl leading-[1.05] italic md:text-8xl"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              opacity: ready ? 1 : 0,
              transform: ready ? "none" : "translateY(14px)",
              transition: "opacity 1.4s ease 0.45s, transform 1.4s ease 0.45s",
            }}
          >
            AI, done better.
          </h1>
          <p
            className="mt-10 text-[13px] text-[#F5F5F3]/60 md:text-xs"
            style={{
              fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif",
              opacity: ready ? 1 : 0,
              transition: "opacity 1.4s ease 0.9s",
            }}
          >
            {CITIES}
          </p>
          <a
            href="#services"
            className="group mt-16 inline-flex items-center gap-3 border border-[#F5F5F3]/20 px-7 py-3 text-[13px]  transition-colors duration-300 hover:border-[#2e9e58] hover:text-[#2e9e58]"
            style={{
              fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif",
              opacity: ready ? 1 : 0,
              transition: "opacity 1.4s ease 1.15s, border-color .3s, color .3s",
            }}
          >
            Begin
            <span className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </a>
        </div>

        <div className="absolute bottom-8 left-1/2 h-10 w-px -translate-x-1/2 bg-gradient-to-b from-transparent to-[#F5F5F3]/30" />
        <span
          className="absolute right-6 bottom-6 text-[13px] text-[#F5F5F3]/25"
          style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
        >
          I
        </span>
      </section>
    </div>
  );
}
