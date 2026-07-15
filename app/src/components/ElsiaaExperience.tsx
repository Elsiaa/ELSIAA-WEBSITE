import { useEffect, useRef, useState } from "react";

/*
  ELSIAA scroll-scrubbed journey.
  One pinned stage (position: sticky) inside a tall scroll track.
  Progress 0..1 across the track drives every phase:
    0.00-0.14  hero text ("AI is just a nice tool...?")
    0.14-0.26  red strikethrough draws, "The future is here." fades in
    0.26-0.40  hero shrinks into the monitor of the MS Paint office still
    0.40-0.72  destruction film scrubbed frame-exact by scroll
    0.72-0.84  HOLD on the ball-in-trash landing frame (scroll dead-zone)
    0.86-1.00  white reset -> "AI.. AI.. AI.. but how?" + wireframe globe
  After the track, normal scroll resumes: services, CTA, footer.
  All browser APIs live inside useEffect (SSR-safe).
*/

const TRACK_VH = 700;
const STILL_SRC = "/assets/office_scene_v5.jpeg";
const FILM_SRC = "/assets/destruction_v5.mp4";
const LANDING_T = 9.85; // seconds — ball settled in the trash

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
function seg(p: number, a: number, b: number) {
  return clamp01((p - a) / (b - a));
}

export function ElsiaaExperience() {
  const trackRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const strikeRef = useRef<SVGPathElement>(null);
  const futureRef = useRef<HTMLParagraphElement>(null);
  const exploreRef = useRef<HTMLButtonElement>(null);
  const officeRef = useRef<HTMLDivElement>(null);
  const videoWrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const resetRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<HTMLCanvasElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onMq = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onMq);
    return () => mq.removeEventListener("change", onMq);
  }, []);

  // --- master scroll driver -------------------------------------------------
  useEffect(() => {
    if (reducedMotion) return;
    const track = trackRef.current;
    const video = videoRef.current;
    if (!track) return;

    let raf = 0;
    let targetTime = 0;
    let lastScrollY = 0;
    let velocity = 0;

    const strike = strikeRef.current;
    const strikeLen = strike ? strike.getTotalLength() : 0;
    if (strike) {
      strike.style.strokeDasharray = `${strikeLen}`;
      strike.style.strokeDashoffset = `${strikeLen}`;
    }

    const update = () => {
      const rect = track.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const p = clamp01(-rect.top / total);

      velocity = window.scrollY - lastScrollY;
      lastScrollY = window.scrollY;

      // Phase A/B: hero + strike
      const strikeP = seg(p, 0.14, 0.24);
      if (strike) strike.style.strokeDashoffset = `${strikeLen * (1 - strikeP)}`;
      if (futureRef.current) {
        futureRef.current.style.transform = `translateY(${(1 - seg(p, 0.18, 0.26)) * 14}px)`;
        futureRef.current.style.opacity = `${seg(p, 0.18, 0.26)}`;
      }
      if (exploreRef.current) {
        exploreRef.current.style.opacity = `${1 - seg(p, 0.14, 0.2)}`;
        exploreRef.current.style.pointerEvents = p > 0.16 ? "none" : "auto";
      }

      // Phase C: morph — hero scales down into monitor, office fades in
      const morph = seg(p, 0.26, 0.4);
      if (heroRef.current) {
        const s = 1 - morph * 0.82;
        heroRef.current.style.transform = `scale(${s}) translateY(${morph * -6}vh)`;
        heroRef.current.style.opacity = `${1 - seg(p, 0.36, 0.42)}`;
      }
      if (officeRef.current) {
        officeRef.current.style.opacity = `${seg(p, 0.3, 0.4) * (1 - seg(p, 0.4, 0.44))}`;
        officeRef.current.style.transform = `scale(${1.06 - seg(p, 0.3, 0.42) * 0.06})`;
      }

      // Phase D: film scrub — lands at 0.72, HOLDS through 0.84
      const film = seg(p, 0.4, 0.72);
      if (videoWrapRef.current) {
        videoWrapRef.current.style.opacity = `${seg(p, 0.4, 0.44) * (1 - seg(p, 0.84, 0.9))}`;
      }
      if (video && video.duration && Number.isFinite(video.duration)) {
        targetTime = film * Math.min(LANDING_T, video.duration - 0.05);
      }

      // Phase E: white reset + globe
      if (resetRef.current) {
        const e = seg(p, 0.86, 0.94);
        resetRef.current.style.opacity = `${e}`;
        resetRef.current.style.pointerEvents = e > 0.5 ? "auto" : "none";
      }

      if (globeRef.current) globeRef.current.dataset.vel = `${velocity}`;
      raf = requestAnimationFrame(update);
    };

    // smooth the seek so scrubbing never fights the decoder
    let seekRaf = 0;
    const seekLoop = () => {
      if (video && video.readyState >= 2) {
        const cur = video.currentTime;
        const diff = targetTime - cur;
        if (Math.abs(diff) > 0.02) {
          video.currentTime = cur + diff * 0.35;
        }
      }
      seekRaf = requestAnimationFrame(seekLoop);
    };

    raf = requestAnimationFrame(update);
    seekRaf = requestAnimationFrame(seekLoop);
    if (video) {
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
    };
  }, [reducedMotion]);

  // --- wireframe node-globe --------------------------------------------------
  useEffect(() => {
    if (reducedMotion) return;
    const canvas = globeRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const size = Math.min(window.innerWidth * 0.5, 360);
    canvas.width = size * DPR;
    canvas.height = size * DPR;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(DPR, DPR);

    const R = size * 0.42;
    const cx = size / 2;
    const cy = size / 2;
    const nodes: { lat: number; lon: number }[] = [];
    for (let la = -60; la <= 60; la += 30) {
      for (let lo = 0; lo < 360; lo += 30) {
        nodes.push({ lat: (la * Math.PI) / 180, lon: (lo * Math.PI) / 180 });
      }
    }
    nodes.push({ lat: Math.PI / 2, lon: 0 }, { lat: -Math.PI / 2, lon: 0 });

    let rot = 0;
    let raf = 0;
    const draw = () => {
      const vel = parseFloat(canvas.dataset.vel || "0");
      rot += 0.004 + Math.min(Math.abs(vel) * 0.0006, 0.03);
      ctx.clearRect(0, 0, size, size);

      const pts = nodes.map((n) => {
        const lon = n.lon + rot;
        const x = Math.cos(n.lat) * Math.sin(lon);
        const y = Math.sin(n.lat);
        const z = Math.cos(n.lat) * Math.cos(lon);
        return { x: cx + x * R, y: cy - y * R, z };
      });

      ctx.lineWidth = 1;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i];
          const b = pts[j];
          if (a.z < -0.15 && b.z < -0.15) continue;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < R * 0.62) {
            const alpha =
              Math.max(0, ((a.z + b.z) / 2 + 0.4) * 0.35) * (1 - d / (R * 0.62));
            if (alpha > 0.02) {
              ctx.strokeStyle = `rgba(60,60,60,${alpha})`;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }
      }
      for (const pnt of pts) {
        if (pnt.z < -0.2) continue;
        const a = (pnt.z + 0.5) * 0.8;
        ctx.fillStyle = `rgba(30,107,60,${Math.max(0.12, a)})`;
        ctx.beginPath();
        ctx.arc(pnt.x, pnt.y, 2.1 + pnt.z * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion]);

  const scrollToServices = () => {
    document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
  };

  if (reducedMotion) {
    return <StaticJourney />;
  }

  return (
    <div ref={trackRef} style={{ height: `${TRACK_VH}vh`, position: "relative" }}>
      <div className="sticky top-0 h-dvh w-full overflow-hidden bg-white">
        {/* Phase A/B — hero */}
        <div
          ref={heroRef}
          className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center will-change-transform"
          style={{ transformOrigin: "50% 42%" }}
        >
          <h1 className="relative max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-[#111111] md:text-7xl">
            AI is just a nice tool...?
            <svg
              className="pointer-events-none absolute left-[-2%] top-1/2 h-[0.5em] w-[104%] -translate-y-1/2"
              viewBox="0 0 1000 60"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                ref={strikeRef}
                d="M8 38 C 180 22, 340 44, 500 30 S 830 40, 992 24"
                fill="none"
                stroke="#E53E3E"
                strokeWidth="9"
                strokeLinecap="round"
              />
            </svg>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-neutral-500 md:text-xl">
            Global presence. Cutting-edge solutions.
          </p>
          <p
            ref={futureRef}
            className="mt-8 text-2xl font-medium text-[#111111] opacity-0 md:text-3xl"
          >
            The future is here.
          </p>
          <button
            ref={exploreRef}
            onClick={scrollToServices}
            className="mt-10 rounded-full border border-neutral-300 px-8 py-3 text-sm font-medium text-neutral-700 transition-colors hover:border-[#1e6b3c] hover:text-[#1e6b3c]"
          >
            Explore
          </button>
        </div>

        {/* Phase C — MS Paint office still */}
        <div
          ref={officeRef}
          className="absolute inset-0 flex items-center justify-center bg-white opacity-0 will-change-transform"
        >
          <img
            src={STILL_SRC}
            alt="A very frustrated, very badly drawn office worker in front of a failing website"
            className="max-h-[56vh] w-auto max-w-[72vw] object-contain"
            loading="eager"
          />
        </div>

        {/* Phase D — scrubbed destruction film */}
        <div
          ref={videoWrapRef}
          className="absolute inset-0 flex items-center justify-center bg-white opacity-0"
        >
          <video
            ref={videoRef}
            src={FILM_SRC}
            className="max-h-[56vh] w-auto max-w-[72vw] object-contain"
            muted
            playsInline
            preload="auto"
            poster={STILL_SRC}
          />
        </div>

        {/* Phase E — white reset + globe */}
        <div
          ref={resetRef}
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-8 bg-white opacity-0"
        >
          <p className="text-2xl font-semibold tracking-tight text-[#111111] md:text-4xl">
            AI.. AI.. AI.. but how?
          </p>
          <p className="max-w-xl px-6 text-center text-base leading-relaxed text-neutral-500 md:text-lg">
            Stretch the limits of what is possible. Discover what AI can change
            in your business and catch up to 2026.
          </p>
          <canvas ref={globeRef} aria-hidden="true" />
          <button
            onClick={scrollToServices}
            className="group text-sm font-medium tracking-wide text-[#1e6b3c]"
          >
            See what we actually do
            <span className="mt-1 block h-px w-0 bg-[#1e6b3c] transition-all duration-300 group-hover:w-full" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* Reduced-motion fallback: the story as a static chapter stack */
function StaticJourney() {
  return (
    <div className="bg-white">
      <section className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
        <h1 className="relative max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-[#111111] md:text-6xl">
          <span className="relative inline-block">
            AI is just a nice tool...?
            <span className="absolute left-0 top-1/2 h-[6px] w-full -translate-y-1/2 rounded bg-[#E53E3E]" />
          </span>
        </h1>
        <p className="mt-6 text-2xl font-medium text-[#111111]">The future is here.</p>
      </section>
      <section className="mx-auto max-w-3xl px-6 pb-16">
        <img
          src={STILL_SRC}
          alt="A very badly drawn office worker losing patience with a failing website"
          className="w-full"
        />
      </section>
      <section className="flex flex-col items-center px-6 pb-24 text-center">
        <p className="text-2xl font-semibold tracking-tight text-[#111111]">
          AI.. AI.. AI.. but how?
        </p>
      </section>
    </div>
  );
}
