import { useEffect, useRef, useState } from "react";

const CITIES = "Antwerp · Geneva · London · Tel Aviv · New York · Los Angeles";

export function EmpireHero() {
  const heroRef = useRef<HTMLElement | null>(null);
  const lionRef = useRef<HTMLImageElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    const hero = heroRef.current;
    const lion = lionRef.current;
    if (!hero || !lion) return;

    // subtle breathing parallax — pointer on desktop, scroll on touch
    let raf = 0;
    let tx = 0,
      ty = 0,
      cx = 0,
      cy = 0;
    const onMove = (e: PointerEvent) => {
      const r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 14;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 10;
    };
    const onScroll = () => {
      const r = hero.getBoundingClientRect();
      ty = (-r.top / Math.max(1, r.height)) * 24;
    };
    const loop = () => {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      lion.style.transform = `translate3d(${cx}px, ${cy}px, 0) scale(1.04)`;
      raf = requestAnimationFrame(loop);
    };
    hero.addEventListener("pointermove", onMove);
    window.addEventListener("scroll", onScroll, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      hero.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-[#070907] text-[#F5F5F3]"
    >
      {/* lion, breathing behind the words */}
      <img
        ref={lionRef}
        src="/assets/lion_real_v1.jpg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.55] transition-opacity duration-[1600ms]"
        style={{ opacity: ready ? 0.55 : 0 }}
      />
      {/* vignette so type always sits on near-black */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(7,9,7,0.25)_0%,rgba(7,9,7,0.78)_78%,rgba(7,9,7,0.95)_100%)]" />

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <p
          className="mb-6 text-[11px] tracking-[0.42em] text-[#2e9e58] uppercase"
          style={{
            fontFamily: "'Inter', sans-serif",
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
          className="mt-10 text-[11px] tracking-[0.18em] text-[#F5F5F3]/60 md:text-xs"
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            opacity: ready ? 1 : 0,
            transition: "opacity 1.4s ease 0.9s",
          }}
        >
          {CITIES}
        </p>
        <a
          href="#services"
          className="group mt-16 inline-flex items-center gap-3 border border-[#F5F5F3]/20 px-7 py-3 text-[11px] tracking-[0.3em] uppercase transition-colors duration-300 hover:border-[#2e9e58] hover:text-[#2e9e58]"
          style={{
            fontFamily: "'Inter', sans-serif",
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

      {/* folio detail: hairline + page mark */}
      <div className="absolute bottom-8 left-1/2 h-10 w-px -translate-x-1/2 bg-gradient-to-b from-transparent to-[#F5F5F3]/30" />
      <span
        className="absolute right-6 bottom-6 text-[10px] tracking-[0.3em] text-[#F5F5F3]/25"
        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
      >
        I
      </span>
    </section>
  );
}
