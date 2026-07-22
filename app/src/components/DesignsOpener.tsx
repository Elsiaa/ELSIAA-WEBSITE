import { useEffect, useRef, useState } from "react";

/*
  DesignsOpener — the cinematic prologue to /designs.

  A single sticky stage scrubbed by scroll. The arc IS the page's thesis:
    problem (bad design)  →  it becomes a website  →  the website becomes a
    world  →  a world without art is just a rock  →  art brings it to life.
  It opens on black and resolves into the white editorial page below, handing
  off directly to "Design is art. And art has a job."

  All motion is transform/opacity only, driven by one rAF loop. Reduced motion
  and no-JS get a clean stacked fallback (three dark panels) — no blank frames.
*/

const mono = { fontFamily: "'IBM Plex Mono', monospace" } as const;
const inter = { fontFamily: "'Inter', sans-serif" } as const;

// smoothstep-ish local progress inside [a,b], clamped to 0..1
function seg(p: number, a: number, b: number) {
  if (p <= a) return 0;
  if (p >= b) return 1;
  return (p - a) / (b - a);
}

export function DesignsOpener() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const deskRef = useRef<HTMLDivElement | null>(null);
  const chromeRef = useRef<HTMLDivElement | null>(null);
  const worldRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const t1Ref = useRef<HTMLDivElement | null>(null); // "Bad design sucks."
  const t2Ref = useRef<HTMLDivElement | null>(null); // "Partner with us…"
  const t3Ref = useRef<HTMLDivElement | null>(null); // "What's the world…"
  const t4Ref = useRef<HTMLDivElement | null>(null); // "Thank god for art."
  const cueRef = useRef<HTMLDivElement | null>(null); // continue cue
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
    let vTarget = 0;
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
      if (!el) return;
      Object.assign(el.style, o);
    };

    const tick = () => {
      const r = wrap.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      const p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;

      // ----- Act I: the desk + browser chrome -----
      // desk holds through the turn, then recedes + rounds into a sphere.
      const recede = seg(p, 0.22, 0.4); // 0..1 as the site flies to space
      const deskScale = 1 - recede * 0.7;
      const deskRot = recede * 52;
      const deskLift = recede * -7;
      const deskRadius = recede * 50;
      const deskFade = 1 - seg(p, 0.34, 0.42);
      set(deskRef.current, {
        transform: `perspective(1400px) translateY(${deskLift}vh) rotateX(${deskRot}deg) scale(${deskScale})`,
        borderRadius: `${deskRadius}%`,
        opacity: String(Math.max(0, deskFade)),
      });
      // browser chrome fades in as "this became a website", out as it recedes
      const chromeIn = seg(p, 0.1, 0.2);
      set(chromeRef.current, { opacity: String(chromeIn * (1 - recede)) });

      // ----- the world (rock → earth bloom video) -----
      const worldIn = seg(p, 0.34, 0.46); // fades up behind the receding site
      const worldScale = 0.82 + seg(p, 0.34, 0.62) * 0.18;
      set(worldRef.current, {
        opacity: String(worldIn),
        transform: `scale(${worldScale.toFixed(3)})`,
      });
      // scrub the bloom: hold on rock during the question, then play to earth
      if (v && ready && vdur) {
        const bloom = seg(p, 0.5, 0.82); // 0 = rock, 1 = living earth
        vTarget = bloom * (vdur - 0.05);
        vCurrent += (vTarget - vCurrent) * 0.15;
        if (Math.abs(v.currentTime - vCurrent) > 0.004) {
          try {
            v.currentTime = vCurrent;
          } catch {
            /* noop */
          }
        }
      }

      // ----- text beats -----
      // 1 · Bad design sucks.
      set(t1Ref.current, {
        opacity: String(Math.min(seg(p, 0.01, 0.06), 1 - seg(p, 0.1, 0.16))),
        transform: `translateY(${(1 - seg(p, 0.01, 0.06)) * 16}px)`,
      });
      // 2 · Partner with us in curing bad design.
      set(t2Ref.current, {
        opacity: String(Math.min(seg(p, 0.12, 0.17), 1 - seg(p, 0.26, 0.33))),
        transform: `translateY(${(1 - seg(p, 0.12, 0.17)) * 16}px)`,
      });
      // 3 · What's the world without art but a rock?
      set(t3Ref.current, {
        opacity: String(Math.min(seg(p, 0.44, 0.5), 1 - seg(p, 0.56, 0.62))),
        transform: `translateY(${(1 - seg(p, 0.44, 0.5)) * 16}px)`,
      });
      // 4 · Thank god for art.
      set(t4Ref.current, {
        opacity: String(seg(p, 0.82, 0.9)),
        transform: `translateY(${(1 - seg(p, 0.82, 0.9)) * 16}px)`,
      });
      set(cueRef.current, { opacity: String(seg(p, 0.9, 0.97)) });

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ---------- reduced-motion / no-JS fallback: three stacked dark panels ----------
  if (reduced) {
    return (
      <section className="bg-[#0a0a0a] text-white" aria-label="Design is art">
        <Panel img="/assets/cine/desk_dark.jpg" kicker="01 · Why we exist">
          <h2 className="text-4xl font-semibold tracking-[-0.04em] md:text-6xl" style={inter}>
            Bad design sucks.
            <span className="mt-2 block h-[3px] w-40 bg-[#2e9e58]" />
          </h2>
          <p className="mt-6 max-w-md text-lg text-white/70" style={inter}>
            Partner with us in curing bad design.
          </p>
        </Panel>
        <Panel img="/assets/cine/rock.jpg" kicker="02 · The thesis">
          <h2 className="max-w-xl text-3xl font-semibold tracking-[-0.035em] md:text-5xl" style={inter}>
            What&rsquo;s the world without art but a rock?
          </h2>
        </Panel>
        <Panel img="/assets/cine/earth.jpg" kicker="03 · The answer">
          <h2 className="text-4xl font-semibold tracking-[-0.04em] md:text-6xl" style={inter}>
            Thank god for <span className="text-[#2e9e58]">art.</span>
          </h2>
          <p className="mt-4 max-w-md text-lg text-white/60" style={inter}>
            Because how boring would that be.
          </p>
        </Panel>
      </section>
    );
  }

  return (
    <section
      ref={wrapRef}
      className="relative bg-[#0a0a0a]"
      style={{ height: "440vh" }}
      aria-label="Design is art — the case for it"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* starfield / vignette base */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 120% at 50% 40%, #141414 0%, #0a0a0a 55%, #050505 100%)",
          }}
        />

        {/* the world — rock → living earth bloom, scrubbed by scroll */}
        <div
          ref={worldRef}
          className="absolute inset-0 flex items-center justify-center opacity-0"
          style={{ willChange: "opacity, transform" }}
        >
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

        {/* the desk → website plane */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            ref={deskRef}
            className="relative w-[86vw] max-w-[1100px] overflow-hidden shadow-[0_60px_160px_-40px_rgba(0,0,0,0.9)]"
            style={{ willChange: "transform, opacity, border-radius", aspectRatio: "16/9" }}
          >
            <img src="/assets/cine/desk_dark.jpg" alt="" className="h-full w-full object-cover" />
            {/* browser chrome that draws on to say 'this became a website' */}
            <div
              ref={chromeRef}
              className="pointer-events-none absolute inset-x-0 top-0 flex items-center gap-2 border-b border-white/10 bg-black/45 px-4 py-2.5 opacity-0 backdrop-blur-sm"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#2e9e58]/70" />
              <span
                className="ml-3 truncate rounded-md bg-white/[0.06] px-3 py-1 text-[10px] tracking-[0.14em] text-white/45"
                style={mono}
              >
                elsiaa.design
              </span>
            </div>
          </div>
        </div>

        {/* ------- text beats (all absolute, cross-fading) ------- */}
        <div className="absolute inset-0">
          {/* 1 · Bad design sucks. — upper-left, over the desk's negative space */}
          <div
            ref={t1Ref}
            className="absolute top-[24%] left-[6vw] max-w-[80vw] opacity-0 md:left-[8vw]"
            style={{ willChange: "opacity, transform" }}
          >
            <p className="text-[10px] tracking-[0.34em] text-[#2e9e58] uppercase" style={mono}>
              01 · Why we exist
            </p>
            <h2
              className="mt-3 text-5xl font-semibold tracking-[-0.045em] text-white md:text-7xl"
              style={inter}
            >
              Bad design sucks.
            </h2>
            <span className="mt-4 block h-[3px] w-44 origin-left bg-[#2e9e58] md:w-56" />
          </div>

          {/* 2 · Partner with us in curing bad design. — centered lower */}
          <div
            ref={t2Ref}
            className="absolute bottom-[16%] left-1/2 w-[88vw] max-w-3xl -translate-x-1/2 text-center opacity-0"
            style={{ willChange: "opacity, transform" }}
          >
            <h2
              className="text-3xl font-semibold tracking-[-0.035em] text-white md:text-5xl"
              style={inter}
            >
              Partner with us in curing bad design.
            </h2>
          </div>

          {/* 3 · What's the world without art but a rock? — left of the rock */}
          <div
            ref={t3Ref}
            className="absolute top-1/2 left-[6vw] w-[80vw] max-w-lg -translate-y-1/2 opacity-0 md:left-[9vw]"
            style={{ willChange: "opacity, transform" }}
          >
            <p className="text-[10px] tracking-[0.34em] text-[#2e9e58] uppercase" style={mono}>
              02 · The thesis
            </p>
            <h2
              className="mt-3 text-4xl leading-[1.05] font-semibold tracking-[-0.04em] text-white md:text-6xl"
              style={inter}
            >
              What&rsquo;s the world without art
              <span className="text-white/45"> but a rock?</span>
            </h2>
          </div>

          {/* 4 · Thank god for art. — centered payoff */}
          <div
            ref={t4Ref}
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-6 text-center opacity-0"
            style={{ willChange: "opacity, transform" }}
          >
            <h2
              className="text-5xl font-semibold tracking-[-0.045em] text-white md:text-8xl"
              style={inter}
            >
              Thank god for <span className="text-[#2e9e58]">art.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-md text-lg text-white/60 md:text-xl" style={inter}>
              Because how boring would that be.
            </p>
          </div>

          {/* continue cue */}
          <div
            ref={cueRef}
            className="absolute bottom-[7%] left-1/2 -translate-x-1/2 text-center opacity-0"
          >
            <p className="text-[10px] tracking-[0.34em] text-white/45 uppercase" style={mono}>
              Continue
            </p>
            <span className="mx-auto mt-2 block h-6 w-px animate-pulse bg-white/40" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Panel({
  img,
  kicker,
  children,
}: {
  img: string;
  kicker: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-[88svh] items-center overflow-hidden">
      <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent" />
      <div className="relative mx-auto w-full max-w-6xl px-6">
        <p className="text-[10px] tracking-[0.34em] text-[#2e9e58] uppercase" style={mono}>
          {kicker}
        </p>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}
