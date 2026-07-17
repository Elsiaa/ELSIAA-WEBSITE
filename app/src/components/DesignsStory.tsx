import { useEffect, useRef } from "react";

/* ---------- shared: Apple-style caption that grows to center ---------- */
function BigCaption({
  children,
  sub,
}: {
  children: React.ReactNode;
  sub?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const tick = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const t = Math.min(
        1,
        Math.max(0, 1 - Math.abs(r.top + r.height / 2 - vh / 2) / (vh * 0.75)),
      );
      el.style.transform = `scale(${0.74 + t * 0.26})`;
      el.style.opacity = String(0.12 + t * 0.88);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <section className="flex min-h-[68svh] items-center justify-center bg-white px-6">
      <div ref={ref} className="max-w-5xl text-center will-change-transform">
        <h2
          className="text-4xl font-semibold tracking-[-0.03em] text-[#111111] md:text-7xl md:leading-[1.05]"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {children}
        </h2>
        {sub && (
          <p className="mt-6 text-lg text-[#111111]/55 md:text-2xl" style={{ fontFamily: "'Inter', sans-serif" }}>
            {sub}
          </p>
        )}
      </div>
    </section>
  );
}

/* ---------- trash can becomes the world; sketch turns real; spins faster ---------- */
function WireGlobe({ speedRef }: { speedRef: React.MutableRefObject<number> }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const size = Math.min(window.innerWidth * 0.6, 420);
    canvas.width = size * DPR;
    canvas.height = size * DPR;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(DPR, DPR);
    const R = size * 0.42;
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
      rot += 0.004 * speedRef.current;
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

function GlobeSection() {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const trashRef = useRef<HTMLImageElement | null>(null);
  const wireRef = useRef<HTMLDivElement | null>(null);
  const globeRef = useRef<HTMLVideoElement | null>(null);
  const line1Ref = useRef<HTMLParagraphElement | null>(null);
  const line2Ref = useRef<HTMLParagraphElement | null>(null);
  const wireSpeed = useRef(1);

  useEffect(() => {
    const track = trackRef.current;
    const trash = trashRef.current;
    const wire = wireRef.current;
    const globe = globeRef.current;
    const l1 = line1Ref.current;
    const l2 = line2Ref.current;
    if (!track || !trash || !wire || !globe || !l1 || !l2) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    const tick = () => {
      const r = track.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, total)));

      // act I — the trash can inflates and dissolves into a sketch of the world
      const m = Math.min(1, p / 0.16);
      trash.style.opacity = String(1 - m);
      trash.style.transform = `scale(${1 + m * 1.4}) rotate(${m * 12}deg)`;

      // act II — the sketch spins, then becomes real
      const real = Math.min(1, Math.max(0, (p - 0.2) / 0.25));
      wire.style.opacity = String(m * (1 - real));
      wire.style.transform = `scale(${0.8 + m * 0.2})`;
      globe.style.opacity = String(real);
      globe.style.transform = `scale(${0.86 + real * 0.14})`;

      // act III — the world accelerates the deeper you go
      const accel = 1 + Math.pow(Math.max(0, (p - 0.35) / 0.65), 1.7) * 9;
      wireSpeed.current = accel;
      if (!reduced) {
        globe.playbackRate = Math.min(8, 0.7 * accel);
        if (globe.paused && real > 0) globe.play().catch(() => {});
      }

      l1.style.opacity = String(Math.min(1, Math.max(0, (p - 0.42) / 0.14)));
      l2.style.opacity = String(Math.min(1, Math.max(0, (p - 0.6) / 0.14)));
      l2.style.letterSpacing = `${0.02 + Math.max(0, p - 0.6) * 0.1}em`;

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={trackRef} style={{ height: "340vh" }} className="relative bg-white">
      <section className="sticky top-0 flex h-[100svh] flex-col items-center justify-center overflow-hidden bg-white">
        <div className="relative flex h-[52svh] w-full items-center justify-center md:h-[60svh]">
          <img
            ref={trashRef}
            src="/assets/trashcan_crop_v1.jpg"
            alt=""
            aria-hidden
            className="absolute h-[70%] w-auto object-contain will-change-transform"
          />
          <div ref={wireRef} className="absolute flex items-center justify-center opacity-0">
            <WireGlobe speedRef={wireSpeed} />
          </div>
          <video
            ref={globeRef}
            src="/assets/globe_spin_v1.mp4"
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden
            className="absolute h-full w-auto object-contain opacity-0 will-change-transform"
          />
        </div>
        <p
          ref={line1Ref}
          className="mt-8 text-3xl font-semibold tracking-[-0.02em] text-[#111111] opacity-0 md:text-6xl"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          The world is moving quickly.
        </p>
        <p
          ref={line2Ref}
          className="mt-3 text-xl text-[#111111]/60 opacity-0 md:text-3xl"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Are you keeping up?
        </p>
      </section>
    </div>
  );
}

/* ---------- graphics matter: bad vs premium, then scroll-scrub disassembly ---------- */
const DIS_SRC = "/assets/sauce_disassemble_v1.mp4";
const DIS_END_T = 9.9;

function GraphicsSection() {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const compareRef = useRef<HTMLDivElement | null>(null);
  const filmWrapRef = useRef<HTMLDivElement | null>(null);
  const filmRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    const compare = compareRef.current;
    const wrap = filmWrapRef.current;
    const video = filmRef.current;
    if (!track || !compare || !wrap || !video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    video.load();
    let targetTime = 0;
    let raf = 0;
    let seekRaf = 0;

    const tick = () => {
      const r = track.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, total)));

      // hold the side-by-side, then the premium shot takes the stage and deconstructs
      const swap = Math.min(1, Math.max(0, (p - 0.3) / 0.12));
      compare.style.opacity = String(1 - swap);
      compare.style.transform = `scale(${1 - swap * 0.06})`;
      wrap.style.opacity = String(swap);

      const film = Math.min(1, Math.max(0, (p - 0.42) / 0.58));
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
    <div ref={trackRef} style={{ height: "340vh" }} className="relative bg-white">
      <section className="sticky top-0 flex h-[100svh] flex-col items-center justify-center overflow-hidden bg-white px-6">
        <div ref={compareRef} className="grid w-full max-w-5xl grid-cols-1 gap-6 will-change-transform md:grid-cols-2">
          <figure className="flex flex-col items-center">
            <img src="/assets/sauce_bad_v1.jpg" alt="Product presented without design" className="aspect-square w-full max-w-md rounded-sm object-cover" />
            <figcaption
              className="mt-4 text-[11px] tracking-[0.28em] text-[#111111]/40 uppercase"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Presented
            </figcaption>
          </figure>
          <figure className="flex flex-col items-center">
            <img src="/assets/sauce_premium_v1.jpg" alt="The same product, marketed properly" className="aspect-square w-full max-w-md rounded-sm object-cover" />
            <figcaption
              className="mt-4 text-[11px] tracking-[0.28em] text-[#1e6b3c] uppercase"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Marketed
            </figcaption>
          </figure>
        </div>
        <div ref={filmWrapRef} className="absolute inset-0 flex items-center justify-center opacity-0">
          <video
            ref={filmRef}
            src={DIS_SRC}
            muted
            playsInline
            preload="auto"
            aria-hidden
            className="h-[78svh] w-auto max-w-[92vw] object-contain"
          />
        </div>
      </section>
    </div>
  );
}

/* ---------- previous work + closing ---------- */
function PreviousWork() {
  return (
    <section className="bg-white px-6 pt-8 pb-28">
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
        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="group flex aspect-[4/3] items-center justify-center bg-[#F5F5F3] transition-all duration-300 hover:-translate-y-1 hover:bg-[#ecece9] hover:shadow-[0_18px_40px_-24px_rgba(17,17,17,0.35)]"
            >
              <span
                className="text-[11px] tracking-[0.3em] text-[#111111]/30 uppercase transition-colors duration-300 group-hover:text-[#1e6b3c]"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Project {String(n).padStart(2, "0")}
              </span>
            </div>
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
        href="/#services"
        className="group mt-12 inline-flex items-center gap-3 border border-[#F5F5F3]/20 px-8 py-3 text-[11px] tracking-[0.3em] uppercase transition-colors duration-300 hover:border-[#2e9e58] hover:text-[#2e9e58]"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        Start your project
        <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
      </a>
      <p
        className="mt-16 text-sm italic text-[#F5F5F3]/40"
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

      <PreviousWork />
      <ClosingCTA />
    </>
  );
}
