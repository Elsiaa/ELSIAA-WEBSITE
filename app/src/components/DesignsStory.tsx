import { useEffect, useRef } from "react";
import { DesignServices } from "./DesignServices";

/* ---------- easing ---------- */
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const easeIO = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/* ---------- Apple-style caption, eased, restrained ---------- */
function BigCaption({ children, sub }: { children: React.ReactNode; sub?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const tick = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const t = easeOut(clamp01(1 - Math.abs(r.top + r.height / 2 - vh / 2) / (vh * 0.85)));
      el.style.transform = `translateY(${(1 - t) * 34}px) scale(${0.94 + t * 0.06})`;
      el.style.opacity = String(0.05 + t * 0.95);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <section className="flex min-h-[66svh] items-center justify-center bg-white px-6">
      <div ref={ref} className="max-w-4xl text-center will-change-transform">
        <h2
          className="text-4xl font-semibold tracking-[-0.03em] text-[#111111] md:text-6xl md:leading-[1.06]"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {children}
        </h2>
        {sub && (
          <p
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#111111]/60 md:text-xl"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {sub}
          </p>
        )}
      </div>
    </section>
  );
}

/* ---------- wireframe sketch globe ---------- */
function WireGlobe({ speedRef }: { speedRef: React.MutableRefObject<number> }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const size = Math.min(window.innerWidth * 0.56, 400);
    canvas.width = size * DPR;
    canvas.height = size * DPR;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(DPR, DPR);
    const R = size * 0.44;
    const cx = size / 2;
    const cy = size / 2;
    const nodes: { lat: number; lon: number }[] = [];
    for (let la = -60; la <= 60; la += 30)
      for (let lo = 0; lo < 360; lo += 30)
        nodes.push({ lat: (la * Math.PI) / 180, lon: (lo * Math.PI) / 180 });
    nodes.push({ lat: Math.PI / 2, lon: 0 }, { lat: -Math.PI / 2, lon: 0 });
    let rot = 0;
    let raf = 0;
    const draw = () => {
      rot += 0.0045 * speedRef.current;
      ctx.clearRect(0, 0, size, size);
      const pts = nodes.map((n) => {
        const lon = n.lon + rot;
        return {
          x: cx + Math.cos(n.lat) * Math.sin(lon) * R,
          y: cy - Math.sin(n.lat) * R,
          z: Math.cos(n.lat) * Math.cos(lon),
        };
      });
      ctx.lineWidth = 1;
      for (let i = 0; i < pts.length; i++)
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i];
          const b = pts[j];
          if (a.z < -0.15 && b.z < -0.15) continue;
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < R * 0.62) {
            const alpha = Math.max(0, ((a.z + b.z) / 2 + 0.4) * 0.35) * (1 - d / (R * 0.62));
            if (alpha > 0.02) {
              ctx.strokeStyle = `rgba(60,60,60,${alpha})`;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }
      for (const p of pts) {
        if (p.z < -0.2) continue;
        ctx.fillStyle = `rgba(30,107,60,${Math.max(0.12, (p.z + 0.5) * 0.8)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.1 + p.z * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [speedRef]);
  return <canvas ref={canvasRef} aria-hidden className="will-change-transform" />;
}

/* ---------- the advanced world: ELSIAA constellation planet ---------- */
function AdvancedGlobe({ speedRef }: { speedRef: React.MutableRefObject<number> }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const size = Math.min(window.innerWidth * 0.62, 460);
    canvas.width = size * DPR;
    canvas.height = size * DPR;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(DPR, DPR);
    const R = size * 0.4;
    const cx = size / 2;
    const cy = size / 2;
    const nodes: { lat: number; lon: number }[] = [];
    for (let la = -75; la <= 75; la += 15)
      for (let lo = 0; lo < 360; lo += 15)
        if (Math.abs(la) < 75 || lo % 60 === 0)
          nodes.push({ lat: (la * Math.PI) / 180, lon: (lo * Math.PI) / 180 });
    let rot = 0;
    let t = 0;
    let raf = 0;
    const draw = () => {
      const sp = speedRef.current;
      rot += 0.0045 * sp;
      t += 0.016;
      ctx.clearRect(0, 0, size, size);

      const pts = nodes.map((n) => {
        const lon = n.lon + rot;
        return {
          x: cx + Math.cos(n.lat) * Math.sin(lon) * R,
          y: cy - Math.sin(n.lat) * R * 0.98,
          z: Math.cos(n.lat) * Math.cos(lon),
        };
      });

      ctx.lineWidth = 0.7;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        if (a.z < -0.1) continue;
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j];
          if (b.z < -0.1) continue;
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < R * 0.34) {
            const alpha = Math.max(0, ((a.z + b.z) / 2) * 0.22) * (1 - d / (R * 0.34));
            if (alpha > 0.015) {
              ctx.strokeStyle = `rgba(30,107,60,${alpha})`;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }
      }

      const arcs = Math.min(7, 2 + Math.floor(sp * 0.7));
      for (let k = 0; k < arcs; k++) {
        const phase = (t * (0.25 + k * 0.07) + k * 1.7) % (Math.PI * 2);
        const la1 = Math.sin(k * 2.1) * 0.9;
        const lo1 = k * 0.9 + rot;
        const la2 = Math.sin(k * 3.7 + 1) * 0.9;
        const lo2 = k * 0.9 + 1.6 + rot;
        const p1 = {
          x: cx + Math.cos(la1) * Math.sin(lo1) * R,
          y: cy - Math.sin(la1) * R * 0.98,
          z: Math.cos(la1) * Math.cos(lo1),
        };
        const p2 = {
          x: cx + Math.cos(la2) * Math.sin(lo2) * R,
          y: cy - Math.sin(la2) * R * 0.98,
          z: Math.cos(la2) * Math.cos(lo2),
        };
        if (p1.z < 0 && p2.z < 0) continue;
        const mx = (p1.x + p2.x) / 2;
        const my = (p1.y + p2.y) / 2 - R * 0.42;
        const glow = 0.32 + 0.28 * Math.sin(phase);
        ctx.strokeStyle = `rgba(46,158,88,${glow})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.quadraticCurveTo(mx, my, p2.x, p2.y);
        ctx.stroke();
      }

      for (const p of pts) {
        if (p.z < -0.15) continue;
        const a = Math.max(0.1, (p.z + 0.4) * 0.9);
        ctx.shadowColor = "rgba(46,158,88,0.9)";
        ctx.shadowBlur = 6 + Math.min(10, sp);
        ctx.fillStyle = `rgba(30,107,60,${a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.6 + p.z * 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [speedRef]);
  return <canvas ref={canvasRef} aria-hidden className="will-change-transform" />;
}

/* ---------- trash can -> sketch of the world -> the real world, accelerating ---------- */
function GlobeSection() {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const wireRef = useRef<HTMLDivElement | null>(null);
  const globeRef = useRef<HTMLVideoElement | null>(null);
  const advRef = useRef<HTMLDivElement | null>(null);
  const line1Ref = useRef<HTMLParagraphElement | null>(null);
  const line2Ref = useRef<HTMLParagraphElement | null>(null);
  const wireSpeed = useRef(1);

  useEffect(() => {
    const track = trackRef.current;
    const wire = wireRef.current;
    const globe = globeRef.current;
    const adv = advRef.current;
    const l1 = line1Ref.current;
    const l2 = line2Ref.current;
    if (!track || !wire || !globe || !adv || !l1 || !l2) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    const tick = () => {
      const r = track.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const p = clamp01(-r.top / Math.max(1, total));

      // the sketch of the world condenses straight out of the dive's white blur
      const wIn = easeIO(seg(p, 0.2, 0.34));
      const real = easeIO(seg(p, 0.38, 0.52));
      wire.style.opacity = String(wIn * (1 - real));
      wire.style.transform = `scale(${0.72 + wIn * 0.28})`;
      wire.style.filter = `blur(${(1 - wIn) * 8}px)`;

      // the sketch becomes real mid-spin
      const advanced = easeIO(seg(p, 0.6, 0.76));
      globe.style.opacity = String(real * (1 - advanced));
      globe.style.transform = `scale(${0.9 + real * 0.1})`;
      globe.style.filter = `blur(${(1 - real) * 6 + advanced * 5}px)`;

      // the faster it spins, the more advanced it becomes:
      // the real world dissolves into the ELSIAA constellation planet
      adv.style.opacity = String(advanced);
      adv.style.transform = `scale(${0.92 + advanced * 0.08})`;
      adv.style.filter = `blur(${(1 - advanced) * 7}px)`;
      const halo = document.getElementById("globe-halo");
      if (halo) halo.style.opacity = String(advanced * 0.9);

      // the world accelerates the deeper you go
      const accel = 1 + Math.pow(seg(p, 0.42, 1), 1.8) * 9;
      wireSpeed.current = accel;
      if (!reduced) {
        globe.playbackRate = Math.min(8, 0.7 * accel);
        if (globe.paused && real > 0) globe.play().catch(() => {});
      }

      const t1 = easeOut(seg(p, 0.56, 0.66));
      const t2 = easeOut(seg(p, 0.7, 0.8));
      l1.style.opacity = String(t1);
      l1.style.transform = `translateY(${(1 - t1) * 22}px)`;
      l2.style.opacity = String(t2);
      l2.style.transform = `translateY(${(1 - t2) * 18}px)`;
      l2.style.letterSpacing = `${0.02 + seg(p, 0.7, 1) * 0.09}em`;

      // graceful exit — the act breathes out before the page moves on
      const exit = easeIO(seg(p, 0.94, 1));
      const stageEl = track.querySelector("section > div") as HTMLElement | null;
      if (stageEl) {
        stageEl.style.opacity = String(1 - exit * 0.9);
        stageEl.style.transform = `translateY(${exit * -3}svh) scale(${1 - exit * 0.04})`;
      }
      l1.style.opacity = String(t1 * (1 - exit));
      l2.style.opacity = String(t2 * (1 - exit));

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={trackRef} style={{ height: "360vh", marginTop: "-100svh" }} className="relative z-0 bg-white">
      <section className="sticky top-0 flex h-[100svh] flex-col items-center justify-center overflow-hidden bg-white">
        <div className="relative flex h-[56svh] w-full items-center justify-center" style={{ perspective: "1100px" }}>
          {/* depth halo — breathes brighter as the world advances */}
          <div
            aria-hidden
            className="absolute h-[64%] w-[64%] rounded-full opacity-0 transition-opacity duration-700"
            ref={(el) => {
              if (el) el.id = "globe-halo";
            }}
            style={{
              background:
                "radial-gradient(circle, rgba(46,158,88,0.16) 0%, rgba(46,158,88,0.05) 45%, transparent 70%)",
              filter: "blur(6px)",
            }}
          />
          <div ref={wireRef} className="absolute flex items-center justify-center opacity-0 will-change-transform">
            <WireGlobe speedRef={wireSpeed} />
          </div>
          <div ref={advRef} className="absolute flex items-center justify-center opacity-0 will-change-transform">
            <AdvancedGlobe speedRef={wireSpeed} />
          </div>
          <video
            ref={globeRef}
            src={typeof window !== "undefined" && window.innerWidth < 768 ? "/assets/globe_spin_v2_lite.mp4" : "/assets/globe_spin_v2.mp4"}
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden
            className="absolute h-full w-auto object-contain opacity-0 will-change-transform"
            style={{
              maskImage: "radial-gradient(circle at 50% 50%, black 62%, transparent 74%)",
              WebkitMaskImage: "radial-gradient(circle at 50% 50%, black 62%, transparent 74%)",
            }}
          />
        </div>
        <div className="h-[16svh]">
          <p
            ref={line1Ref}
            className="mt-6 text-center text-3xl font-semibold tracking-[-0.02em] text-[#111111] opacity-0 will-change-transform md:text-6xl"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            The world is moving quickly.
          </p>
          <p
            ref={line2Ref}
            className="mt-3 text-center text-lg text-[#111111]/55 opacity-0 will-change-transform md:text-2xl"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Are you keeping up?
          </p>
        </div>
      </section>
    </div>
  );
}

/* ---------- graphics matter: presented vs marketed, then the product comes apart ---------- */
const DIS_SRC =
  typeof window !== "undefined" && window.innerWidth < 768
    ? "/assets/laptop_disassemble_v1_lite.mp4"
    : "/assets/laptop_disassemble_v1.mp4";
const DIS_END_T = 9.9;
const STAGE_RED = "#0a120c";

function TiltCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `rotateY(${px * 10}deg) rotateX(${-py * 10}deg) translateZ(14px)`;
    el.style.setProperty("--gx", `${(px + 0.5) * 100}%`);
    el.style.setProperty("--gy", `${(py + 0.5) * 100}%`);
  };
  const onLeave = () => {
    const el = ref.current;
    if (el) el.style.transform = "rotateY(0deg) rotateX(0deg) translateZ(0)";
  };
  return (
    <div style={{ perspective: "900px" }}>
      <div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className="relative transition-transform duration-200 ease-out will-change-transform"
        style={{ transformStyle: "preserve-3d" }}
      >
        {children}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 hover:opacity-100"
          style={{
            background:
              "radial-gradient(circle at var(--gx, 50%) var(--gy, 50%), rgba(255,255,255,0.28) 0%, transparent 55%)",
          }}
        />
      </div>
    </div>
  );
}

function GraphicsSection() {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLElement | null>(null);
  const badRef = useRef<HTMLElement | null>(null);
  const goodRef = useRef<HTMLElement | null>(null);
  const filmWrapRef = useRef<HTMLDivElement | null>(null);
  const filmRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    const bad = badRef.current;
    const good = goodRef.current;
    const wrap = filmWrapRef.current;
    const video = filmRef.current;
    if (!track || !stage || !bad || !good || !wrap || !video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    video.load();
    let targetTime = 0;
    let raf = 0;
    let seekRaf = 0;

    const tick = () => {
      const r = track.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const p = clamp01(-r.top / Math.max(1, total));

      // cards arrive one after the other
      const inBad = easeOut(seg(p, 0.02, 0.12));
      const inGood = easeOut(seg(p, 0.08, 0.18));
      bad.style.opacity = String(inBad);
      bad.style.transform = `translateY(${(1 - inBad) * 46}px)`;
      good.style.opacity = String(inGood * (1 - easeIO(seg(p, 0.34, 0.44))));
      good.style.transform = `translateY(${(1 - inGood) * 46}px) scale(${1 + easeIO(seg(p, 0.34, 0.44)) * 0.12})`;

      // the amateur shot bows out, the stage darkens to the film's palette
      bad.style.opacity = String(inBad * (1 - easeIO(seg(p, 0.3, 0.4))));
      const dark = easeIO(seg(p, 0.34, 0.46)) * (1 - easeIO(seg(p, 0.93, 1)));
      stage.style.backgroundColor = dark > 0.02 ? STAGE_RED : "#ffffff";
      stage.style.setProperty("--dark", String(dark));

      // the premium shot takes the stage and comes apart under your finger
      const wIn = easeIO(seg(p, 0.38, 0.48));
      wrap.style.opacity = String(wIn * (1 - easeIO(seg(p, 0.9, 0.97))));
      wrap.style.transform = `scale(${1 + (1 - wIn) * 0.04})`;
      const film = seg(p, 0.48, 0.94);
      targetTime = film * DIS_END_T;

      raf = requestAnimationFrame(tick);
    };

    const seekLoop = () => {
      if (video.readyState >= 2 && !video.seeking && Number.isFinite(video.duration)) {
        const cur = video.currentTime;
        const diff = targetTime - cur;
        if (Math.abs(diff) > 0.034) {
          const step = Math.max(-0.5, Math.min(0.5, diff * 0.5));
          video.currentTime = Math.max(0, Math.min(DIS_END_T, cur + step));
        }
      }
      seekRaf = requestAnimationFrame(seekLoop);
    };

    raf = requestAnimationFrame(tick);
    seekRaf = requestAnimationFrame(seekLoop);
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(seekRaf);
    };
  }, []);

  return (
    <div ref={trackRef} style={{ height: "380vh" }} className="relative">
      <section
        ref={stageRef}
        className="sticky top-0 flex h-[100svh] flex-col items-center justify-center overflow-hidden bg-white px-6 transition-colors duration-700"
      >
        <div className="grid w-full max-w-5xl grid-cols-1 items-start gap-8 md:grid-cols-2">
          <figure ref={badRef} className="flex flex-col items-center opacity-0 will-change-transform">
            <TiltCard>
              <div className="overflow-hidden rounded-xl shadow-[0_24px_60px_-28px_rgba(17,17,17,0.4)]">
                <img
                  src="/assets/laptop_bad_v1.jpg"
                  alt="Product presented without design"
                  className="aspect-square w-full max-w-md object-cover saturate-[0.85]"
                />
              </div>
            </TiltCard>
            <figcaption
              className="mt-5 text-[11px] tracking-[0.3em] text-[#111111]/55 uppercase"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Presented
            </figcaption>
          </figure>
          <figure ref={goodRef} className="flex flex-col items-center opacity-0 will-change-transform">
            <TiltCard>
              <div className="overflow-hidden rounded-xl shadow-[0_32px_80px_-24px_rgba(30,107,60,0.45)]">
                <img
                  src="/assets/laptop_premium_v1.jpg"
                  alt="The same product, marketed properly"
                  className="aspect-square w-full max-w-md object-cover"
                />
              </div>
            </TiltCard>
            <figcaption
              className="mt-5 text-[11px] tracking-[0.3em] text-[#1e6b3c] uppercase"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Marketed
            </figcaption>
          </figure>
        </div>
        <div
          ref={filmWrapRef}
          className="absolute inset-0 flex items-center justify-center opacity-0 will-change-transform"
        >
          <video
            ref={filmRef}
            src={DIS_SRC}
            muted
            playsInline
            preload="auto"
            aria-hidden
            className="h-full w-full object-cover"
          />
        </div>
      </section>
    </div>
  );
}

/* ---------- previous work + closing ---------- */
function PreviousWork() {
  const WORK = [
    { img: "/assets/work_identity.jpg", label: "Constellation Lion", meta: "Brand Identity System" },
    { img: "/assets/work_lion.jpg", label: "The Living Hero", meta: "Cinemagraph Direction" },
    { img: "/assets/work_ad.jpg", label: "Machine, Staged", meta: "Commercial Product Ad" },
    { img: "/assets/laptop_bad_v1.jpg", label: "Before the Studio", meta: "Transformation Source" },
    { img: "/assets/work_illustration.jpg", label: "The Office Guy", meta: "Custom Illustration" },
    { img: "/assets/trashcan_cut_v2.png", label: "This Very Page", meta: "Interactive Experience", self: true },
  ];
  return (
    <section className="bg-white px-6 pt-10 pb-28">
      <div className="mx-auto max-w-6xl">
        <p
          className="text-[11px] tracking-[0.34em] text-[#1e6b3c] uppercase"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          Selected work
        </p>
        <h2
          className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.02em] text-[#111111] md:text-5xl"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Discover our previous work.
        </h2>
        <p className="mt-3 max-w-xl text-base text-[#111111]/60" style={{ fontFamily: "'Inter', sans-serif" }}>
          Every piece on this page — the identity, the films, the experience you just
          scrolled — is our own work. The portfolio is the site.
        </p>
        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5">
          {WORK.map((w) => (
            <figure
              key={w.label}
              className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-[#0d0f0e] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-24px_rgba(17,17,17,0.45)]"
            >
              <img
                src={w.img}
                alt={`${w.label} — ${w.meta}`}
                className={`h-full w-full transition-transform duration-500 group-hover:scale-[1.04] ${
                  w.self ? "object-contain p-10 opacity-90" : "object-cover"
                }`}
              />
              <figcaption className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-4 pt-10">
                <span
                  className="text-sm font-semibold text-white"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {w.label}
                </span>
                <span
                  className="text-[10px] tracking-[0.24em] text-white/60 uppercase"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {w.meta}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClosingCTA() {
  return (
    <section className="bg-[#070907] px-6 py-32 text-center text-[#F5F5F3]">
      <p
        className="text-[11px] tracking-[0.42em] text-[#2e9e58] uppercase"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        ELSIAA
      </p>
      <h2
        className="mx-auto mt-6 max-w-3xl text-4xl leading-[1.08] italic md:text-6xl"
        style={{ fontFamily: "'Cormorant Garamond', serif" }}
      >
        Your product deserves to look the part.
      </h2>
      <a
        href="/quote"
        className="group mt-12 inline-flex items-center gap-3 border border-[#F5F5F3]/25 px-8 py-3 text-[11px] tracking-[0.3em] uppercase transition-colors duration-300 hover:border-[#2e9e58] hover:text-[#2e9e58]"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        Start your project
        <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
      </a>
      <p
        className="mt-14 text-[10px] tracking-[0.22em] text-[#F5F5F3]/35 uppercase"
        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
      >
        Antwerp · Geneva · London · Tel Aviv · New York · Los Angeles
      </p>
      <p
        className="mt-8 text-sm italic text-[#F5F5F3]/40"
        style={{ fontFamily: "'Cormorant Garamond', serif" }}
      >
        Omnia possibilia
      </p>
    </section>
  );
}

/* ---------- assembled story ---------- */
export function DesignsStory() {
  return (
    <>
      <GlobeSection />

      <BigCaption sub="Your web presence matters — and your graphics decide who trusts you. That&rsquo;s why choosing the right team matters.">
        It&rsquo;s 2026. There&rsquo;s no excuse for poorly designed software.
      </BigCaption>

      <GraphicsSection />

      <BigCaption sub="It&rsquo;s not just how good your product is — it&rsquo;s how good it looks. Humans judge by presentation. Don&rsquo;t let graphics be the reason your client chooses your competitor.">
        Whoever said &ldquo;don&rsquo;t judge a book by its cover&rdquo; lied.
      </BigCaption>

      <DesignServices />

      <PreviousWork />
      <ClosingCTA />
    </>
  );
}
