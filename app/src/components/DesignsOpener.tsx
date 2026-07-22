import { useEffect, useRef, useState } from "react";

/*
  DesignsOpener — the prologue to /designs.
  A tight scroll-scrubbed passage: a dead rock ("a world without art") blooms
  into a living earth ("thank god for art"). It emerges dark, then dissolves
  to white and hands off into "Design is art. And art has a job." — so it reads
  as a passage inside the page, not a separate takeover.
  Transform/opacity only, one rAF loop. Reduced motion → two static panels.
*/

const mono = { fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" } as const;
const inter = { fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" } as const;

function seg(p: number, a: number, b: number) {
  if (p <= a) return 0;
  if (p >= b) return 1;
  return (p - a) / (b - a);
}

export function DesignsOpener() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const worldRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const qRef = useRef<HTMLDivElement | null>(null); // "What's the world…"
  const aRef = useRef<HTMLDivElement | null>(null); // "Thank god for art."
  const cueRef = useRef<HTMLDivElement | null>(null);
  const exitRef = useRef<HTMLDivElement | null>(null); // white dissolve
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReduced(true);
      return;
    }
    const wrap = wrapRef.current;
    const v = videoRef.current;
    if (!wrap) return;

    let vdur = 0;
    let ready = false;
    let vCurrent = 0;
    if (v) {
      const onMeta = () => {
        ready = true;
        vdur = Number.isFinite(v.duration) ? v.duration : 0;
      };
      v.addEventListener("loadedmetadata", onMeta);
      if (v.readyState >= 1) onMeta();
    }

    let raf = 0;
    const set = (el: HTMLElement | null, o: Partial<CSSStyleDeclaration>) => {
      if (el) Object.assign(el.style, o);
    };

    const tick = () => {
      const r = wrap.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      const p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;

      // world: gently scales up across the whole passage
      const worldScale = 0.9 + seg(p, 0, 0.72) * 0.14;
      set(worldRef.current, { transform: `scale(${worldScale.toFixed(3)})` });

      // scrub the bloom: hold on rock during the question, play to earth
      if (v && ready && vdur) {
        const bloom = seg(p, 0.34, 0.72); // 0 = rock, 1 = living earth
        const target = bloom * (vdur - 0.05);
        vCurrent += (target - vCurrent) * 0.15;
        if (Math.abs(v.currentTime - vCurrent) > 0.004) {
          try {
            v.currentTime = vCurrent;
          } catch {
            /* noop */
          }
        }
      }

      // 1 · What's the world without art but a rock?
      set(qRef.current, {
        opacity: String(Math.min(seg(p, 0.04, 0.1), 1 - seg(p, 0.3, 0.38))),
        transform: `translateY(${(1 - seg(p, 0.04, 0.1)) * 16}px)`,
      });
      // 2 · Thank god for art.
      set(aRef.current, {
        opacity: String(seg(p, 0.74, 0.82)),
        transform: `translateY(${(1 - seg(p, 0.74, 0.82)) * 16}px)`,
      });
      set(cueRef.current, { opacity: String(Math.min(seg(p, 0.86, 0.93), 1 - seg(p, 0.97, 1))) });
      // dissolve to white at the very end → hands into the white section below
      set(exitRef.current, { opacity: String(seg(p, 0.9, 1)) });

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (reduced) {
    return (
      <section className="bg-[#0a0a0a] text-white" aria-label="Design is art">
        <Panel img="/assets/cine/rock.jpg" kicker="01 · The thesis">
          <h2 className="max-w-xl text-3xl font-semibold tracking-[-0.035em] md:text-5xl" style={inter}>
            What&rsquo;s the world without art but a rock?
          </h2>
        </Panel>
        <Panel img="/assets/cine/earth.jpg" kicker="02 · The answer" toWhite>
          <h2 className="text-4xl font-semibold tracking-[-0.04em] md:text-6xl" style={inter}>
            Thank god for <span className="text-[#2e9e58]">art.</span>
          </h2>
          <p className="mt-4 max-w-md text-lg text-white/70" style={inter}>Because how boring would that be.</p>
        </Panel>
      </section>
    );
  }

  return (
    <section ref={wrapRef} className="relative bg-[#0a0a0a]" style={{ height: "300vh" }} aria-label="Design is art — the case for it">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div className="absolute inset-0" style={{ background: "radial-gradient(120% 120% at 55% 45%, #141414 0%, #0a0a0a 55%, #040404 100%)" }} />

        {/* rock → living earth bloom, scrubbed by scroll */}
        <div ref={worldRef} className="absolute inset-0 flex items-center justify-center" style={{ willChange: "transform" }}>
          <video
            ref={videoRef}
            src="/assets/cine/bloom.mp4"
            poster="/assets/cine/rock.jpg"
            muted
            playsInline
            preload="auto"
            className="h-full w-full object-cover"
          />
        </div>

        {/* eyebrow, ties it to the page */}
        <p className="absolute top-[16%] left-[6vw] text-[10px] tracking-[0.34em] text-white/40 uppercase md:left-[8vw]" style={mono}>
          ELSIAA · Designs
        </p>

        {/* 1 · the question */}
        <div ref={qRef} className="absolute top-1/2 left-[6vw] w-[82vw] max-w-xl -translate-y-1/2 md:left-[8vw]" style={{ willChange: "opacity, transform" }}>
          <p className="text-[10px] tracking-[0.34em] text-[#2e9e58] uppercase" style={mono}>01 · The thesis</p>
          <h2 className="mt-3 text-4xl leading-[1.04] font-semibold tracking-[-0.04em] text-white md:text-6xl" style={inter}>
            What&rsquo;s the world without art
            <span className="text-white/45"> but a rock?</span>
          </h2>
        </div>

        {/* 2 · the answer */}
        <div ref={aRef} className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-6 text-center opacity-0" style={{ willChange: "opacity, transform" }}>
          <h2 className="text-5xl font-semibold tracking-[-0.045em] text-white md:text-8xl" style={inter}>
            Thank god for <span className="text-[#2e9e58]">art.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-lg text-white/65 md:text-xl" style={inter}>Because how boring would that be.</p>
        </div>

        {/* continue cue */}
        <div ref={cueRef} className="absolute bottom-[7%] left-1/2 -translate-x-1/2 text-center opacity-0">
          <p className="text-[10px] tracking-[0.34em] text-white/45 uppercase" style={mono}>Continue</p>
          <span className="mx-auto mt-2 block h-6 w-px animate-pulse bg-white/40" />
        </div>

        {/* dissolve to white — seamless handoff into "Design is art." */}
        <div ref={exitRef} className="pointer-events-none absolute inset-0 bg-white opacity-0" />
      </div>
    </section>
  );
}

function Panel({ img, kicker, children, toWhite }: { img: string; kicker: string; children: React.ReactNode; toWhite?: boolean }) {
  return (
    <div className="relative flex min-h-[88svh] items-center overflow-hidden">
      <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent" />
      {toWhite && <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-white" />}
      <div className="relative mx-auto w-full max-w-6xl px-6">
        <p className="text-[10px] tracking-[0.34em] text-[#2e9e58] uppercase" style={mono}>{kicker}</p>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}
