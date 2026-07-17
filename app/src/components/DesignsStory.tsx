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
    <section className="flex min-h-[85svh] items-center justify-center bg-white px-6">
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

/* ---------- trash can becomes the world; spins faster as you scroll ---------- */
function GlobeSection() {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const trashRef = useRef<HTMLImageElement | null>(null);
  const globeRef = useRef<HTMLVideoElement | null>(null);
  const line1Ref = useRef<HTMLParagraphElement | null>(null);
  const line2Ref = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    const trash = trashRef.current;
    const globe = globeRef.current;
    const l1 = line1Ref.current;
    const l2 = line2Ref.current;
    if (!track || !trash || !globe || !l1 || !l2) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    const tick = () => {
      const r = track.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, total)));

      // metamorphosis: trash can inflates and dissolves into the spinning earth
      const m = Math.min(1, p / 0.22);
      trash.style.opacity = String(1 - m);
      trash.style.transform = `scale(${1 + m * 1.6}) rotate(${m * 14}deg)`;
      globe.style.opacity = String(m);
      globe.style.transform = `scale(${0.62 + m * 0.38})`;

      // the world accelerates the deeper you go
      const speed = 0.6 + Math.pow(Math.max(0, (p - 0.22) / 0.78), 1.6) * 5.4;
      if (!reduced) {
        globe.playbackRate = Math.min(6, speed);
        if (globe.paused && m > 0) globe.play().catch(() => {});
      }

      l1.style.opacity = String(Math.min(1, Math.max(0, (p - 0.25) / 0.15)));
      l2.style.opacity = String(Math.min(1, Math.max(0, (p - 0.55) / 0.15)));
      l2.style.letterSpacing = `${0.02 + Math.max(0, p - 0.55) * 0.1}em`;

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={trackRef} style={{ height: "320vh" }} className="relative bg-white">
      <section className="sticky top-0 flex h-[100svh] flex-col items-center justify-center overflow-hidden bg-white">
        <div className="relative flex h-[52svh] w-full items-center justify-center md:h-[60svh]">
          <img
            ref={trashRef}
            src="/assets/trashcan_crop_v1.jpg"
            alt=""
            aria-hidden
            className="absolute h-[70%] w-auto object-contain will-change-transform"
          />
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
          The world is changing.
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
    <div ref={trackRef} style={{ height: "420vh" }} className="relative bg-white">
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

/* ---------- previous work placeholders ---------- */
function PreviousWork() {
  return (
    <section className="bg-white px-6 pb-40">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="flex aspect-[4/3] items-center justify-center bg-[#F5F5F3] transition-colors duration-300 hover:bg-[#ecece9]"
            >
              <span
                className="text-[11px] tracking-[0.3em] text-[#111111]/30 uppercase"
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

/* ---------- assembled story ---------- */
export function DesignsStory() {
  return (
    <>
      <BigCaption sub="Your web presence matters.">
        It&rsquo;s 2026. There&rsquo;s no excuse for poorly designed software.
      </BigCaption>

      <GlobeSection />

      <BigCaption sub="That&rsquo;s why choosing the right team matters.">
        Your graphics matter.
      </BigCaption>

      <GraphicsSection />

      <BigCaption sub="Humans judge by presentation. Don&rsquo;t let graphics be the reason your client chooses your competitor.">
        It&rsquo;s not just how good your product is. It&rsquo;s how good it looks. Whoever said
        &ldquo;don&rsquo;t judge a book by its cover&rdquo; lied.
      </BigCaption>

      <BigCaption sub="A glimpse of what we build.">Discover our previous work.</BigCaption>
      <PreviousWork />
    </>
  );
}
