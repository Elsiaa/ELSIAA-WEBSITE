import { useEffect, useRef, useState } from "react";

/*
  DesignsCloser — the closing passage of /designs.
  After the work has spoken, the page lands its thesis: a dead rock ("a world
  without art") blooms into a living earth ("thank god for art"), resolving on
  "Design is art. And art has a job." and a single CTA. Dark, cinematic, the
  final note before the footer. Transform/opacity only; reduced motion → panels.
*/

const mono = { fontFamily: "var(--font-sans)" } as const;
const inter = { fontFamily: "var(--font-sans)" } as const;

function seg(p: number, a: number, b: number) {
  if (p <= a) return 0;
  if (p >= b) return 1;
  return (p - a) / (b - a);
}

export function DesignsOpener() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const worldRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const qRef = useRef<HTMLDivElement | null>(null);
  const aRef = useRef<HTMLDivElement | null>(null);
  const ctaRef = useRef<HTMLDivElement | null>(null);
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

      const worldScale = 0.9 + seg(p, 0, 0.7) * 0.14;
      set(worldRef.current, { transform: `scale(${worldScale.toFixed(3)})`, opacity: String(0.35 + seg(p, 0, 0.12) * 0.65) });

      if (v && ready && vdur) {
        const bloom = seg(p, 0.32, 0.7);
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

      set(qRef.current, {
        opacity: String(Math.min(seg(p, 0.05, 0.11), 1 - seg(p, 0.28, 0.36))),
        transform: `translateY(${(1 - seg(p, 0.05, 0.11)) * 16}px)`,
      });
      set(aRef.current, {
        opacity: String(Math.min(seg(p, 0.7, 0.79), 1 - seg(p, 0.86, 0.92))),
        transform: `translateY(${(1 - seg(p, 0.7, 0.79)) * 16}px)`,
      });
      set(ctaRef.current, {
        opacity: String(seg(p, 0.87, 0.95)),
        transform: `translateY(${(1 - seg(p, 0.87, 0.95)) * 18}px)`,
      });

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (reduced) {
    return (
      <section className="bg-[#0a0a0a] text-white" aria-label="Design is the last mile">
        <Panel img="/assets/cine/rock.jpg" kicker="The last mile">
          <h2 className="max-w-xl text-3xl font-semibold tracking-[-0.035em] md:text-5xl" style={inter}>
            Design is the last mile.
          </h2>
          <p className="mt-4 max-w-md text-lg text-white/70" style={inter}>
            The best strategy, the smartest AI, the cleanest code — none of it lands if the experience doesn&rsquo;t feel exceptional. We close that gap: every surface your brand touches, one identity, one level of quality.
          </p>
        </Panel>
        <Panel img="/assets/cine/earth.jpg" kicker="The Moon">
          <h2 className="text-4xl font-semibold tracking-[-0.04em] md:text-6xl" style={inter}>
            We built this page to feel like the <span className="text-[#2e9e58]">future.</span>
          </h2>
          <p className="mt-4 max-w-md text-lg text-white/70" style={inter}>
            Clean. Intentional. Quietly powerful — like the work we do for our clients.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="mailto:info@elsiaa.com?subject=Stage%20my%20product" className="inline-block rounded-full bg-[#2e9e58] px-9 py-4 text-[13px] font-bold text-white  transition-all hover:bg-white hover:text-[#111111]" style={mono}>
              Stage my product →
            </a>
            <a href="/contact" className="inline-block rounded-full border border-white/25 px-8 py-4 text-[13px] font-bold text-white  transition-all hover:border-white hover:bg-white hover:text-[#111111]" style={mono}>
              Book a strategy call →
            </a>
          </div>
        </Panel>
      </section>
    );
  }

  return (
    <section ref={wrapRef} className="relative bg-[#0a0a0a]" style={{ height: "320vh" }} aria-label="Design is art — the close">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div className="absolute inset-0" style={{ background: "radial-gradient(120% 120% at 55% 45%, #141414 0%, #0a0a0a 55%, #040404 100%)" }} />
        {/* top vignette — a soft seam from the section above */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/70 to-transparent" />

        <div ref={worldRef} className="absolute inset-0 flex items-center justify-center" style={{ willChange: "transform, opacity" }}>
          <video ref={videoRef} src="/assets/cine/bloom.mp4" poster="/assets/cine/rock.jpg" muted playsInline preload="auto" className="h-full w-full object-cover" />
        </div>

        <p className="absolute top-[15%] left-[6vw] text-[13px] text-white/40  md:left-[8vw]" style={mono}>
          ELSIAA · Designs — the last mile
        </p>

        {/* the philosophy */}
        <div ref={qRef} className="absolute top-1/2 left-[6vw] w-[82vw] max-w-xl -translate-y-1/2 md:left-[8vw]" style={{ willChange: "opacity, transform" }}>
          <p className="text-[13px] text-[#2e9e58] " style={mono}>The last mile</p>
          <h2 className="mt-3 text-4xl leading-[1.04] font-semibold tracking-[-0.04em] text-white md:text-6xl" style={inter}>
            Design is the
            <span className="text-white/45"> last mile.</span>
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/65 md:text-lg" style={inter}>
            The best strategy and the smartest AI still fail if the experience doesn&rsquo;t feel exceptional. We close that gap.
          </p>
        </div>

        {/* the moon */}
        <div ref={aRef} className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-6 text-center opacity-0" style={{ willChange: "opacity, transform" }}>
          <p className="text-[13px] text-[#2e9e58] " style={mono}>The Moon</p>
          <h2 className="mt-3 text-5xl font-semibold tracking-[-0.045em] text-white md:text-8xl" style={inter}>
            Built to feel like the <span className="text-[#2e9e58]">future.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-lg text-white/65 md:text-xl" style={inter}>Clean. Intentional. Quietly powerful — like the work we do for our clients.</p>
        </div>

        {/* the close: CTA */}
        <div ref={ctaRef} className="absolute inset-x-0 bottom-[12%] px-6 text-center opacity-0" style={{ willChange: "opacity, transform" }}>
          <p className="text-[15px] tracking-[0.02em] text-white/70 md:text-lg" style={inter}>
            Ready to close the gap on <span className="text-white">your brand?</span>
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <a href="mailto:info@elsiaa.com?subject=Stage%20my%20product" className="rounded-full bg-[#2e9e58] px-9 py-4 text-[13px] font-bold text-white  transition-all hover:bg-white hover:text-[#111111]" style={mono}>
              Stage my product →
            </a>
            <a href="/contact" className="rounded-full border border-white/25 px-8 py-4 text-[13px] font-bold text-white  transition-all hover:border-white hover:bg-white hover:text-[#111111]" style={mono}>
              Book a strategy call →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Panel({ img, kicker, children }: { img: string; kicker: string; children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-[88svh] items-center overflow-hidden">
      <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent" />
      <div className="relative mx-auto w-full max-w-6xl px-6">
        <p className="text-[13px] text-[#2e9e58] " style={mono}>{kicker}</p>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}
