import { useEffect, useRef, useState } from "react";

/*
  ELSIAA Designs showcase — follows the cartoon opener.
  Statement → Discover Designs (live side-by-side: our Prime Bins uplift
  vs the original Mr. Bins site) → Transformations → Beyond Websites →
  Results → Final CTA. All reveals eased, scroll-pure, reduced-motion safe.
*/

/* ---------------- shared: eased in-view reveal ---------------- */
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.opacity = "1";
      el.style.transform = "none";
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            el.style.opacity = "1";
            el.style.transform = "none";
            io.disconnect();
          }
      },
      { threshold: 0.16 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: 0,
        transform: "translateY(34px)",
        transition: `opacity .9s cubic-bezier(.22,.61,.36,1) ${delay}s, transform .9s cubic-bezier(.22,.61,.36,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

/* ---------------- shared: 3D tilt card with glare ---------------- */
function Tilt({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `rotateY(${px * 7}deg) rotateX(${-py * 7}deg) translateZ(10px)`;
    el.style.setProperty("--gx", `${(px + 0.5) * 100}%`);
    el.style.setProperty("--gy", `${(py + 0.5) * 100}%`);
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = "none";
  };
  return (
    <div style={{ perspective: "1100px" }}>
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
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 hover:opacity-100"
          style={{
            background:
              "radial-gradient(circle at var(--gx,50%) var(--gy,50%), rgba(255,255,255,0.22) 0%, transparent 55%)",
          }}
        />
      </div>
    </div>
  );
}

/* ---------------- 1 · statement ---------------- */
function Statement() {
  return (
    <section className="flex min-h-[78svh] flex-col items-center justify-center bg-white px-6 text-center">
      <Reveal>
        <h2
          className="mx-auto max-w-4xl text-4xl font-semibold tracking-[-0.03em] text-[#111111] md:text-7xl md:leading-[1.03]"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          We don&rsquo;t just design websites —<br className="hidden md:block" /> we uplift
          brands.
        </h2>
      </Reveal>
      <Reveal delay={0.12}>
        <p
          className="mx-auto mt-6 max-w-xl text-lg text-[#111111]/50 md:text-xl"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          From outdated to outstanding.
        </p>
      </Reveal>
      <Reveal delay={0.2}>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#discover-designs"
            className="rounded-full border border-[#111111] bg-[#111111] px-8 py-3.5 text-[11px] tracking-[0.28em] text-white uppercase transition-all duration-300 hover:bg-[#1e6b3c] hover:border-[#1e6b3c]"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Explore our work
          </a>
          <a
            href="mailto:isya@elsiaa.com?subject=Design%20project%20inquiry"
            className="rounded-full border border-[#111111]/25 px-8 py-3.5 text-[11px] tracking-[0.28em] text-[#111111] uppercase transition-all duration-300 hover:border-[#1e6b3c] hover:text-[#1e6b3c]"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Start your project
          </a>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------------- 2 · discover designs — the hero comparison ---------------- */
function DiscoverDesigns() {
  return (
    <section id="discover-designs" className="flex min-h-[100svh] flex-col justify-center bg-[#070907] px-6 py-16 text-[#F5F5F3]">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p
            className="text-center text-[11px] tracking-[0.34em] text-[#2e9e58] uppercase"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Discover designs
          </p>
          <h2
            className="mx-auto mt-3 max-w-3xl text-center text-2xl font-semibold tracking-[-0.03em] md:text-4xl md:leading-[1.1]"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Your website is where potential customers see your business for the first
            time.
          </h2>
          <p
            className="mx-auto mt-3 max-w-xl text-center text-base text-white/50 md:text-xl"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            What kind of impression are you making?
          </p>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Reveal delay={0.05}>
            <figure className="overflow-hidden rounded-2xl border border-[#2e9e58]/35 bg-white shadow-[0_40px_100px_-40px_rgba(46,158,88,0.35)]">
              <div className="flex items-center gap-2 border-b border-black/10 bg-[#F0F0EE] px-4 py-2.5">
                <span className="h-2 w-2 rounded-full bg-[#E5695E]" />
                <span className="h-2 w-2 rounded-full bg-[#E0A63F]" />
                <span className="h-2 w-2 rounded-full bg-[#57A85C]" />
                <span
                  className="mx-auto rounded-md bg-white px-4 py-0.5 text-[9px] tracking-[0.08em] text-black/45"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  primebins.com
                </span>
                <span className="h-2 w-6" />
              </div>
              <div className="h-[380px] overflow-hidden md:h-[46svh]">
                <iframe
                  src="https://primebins.com"
                  title="Prime Bins — designed by ELSIAA (live site)"
                  loading="lazy"
                  className="origin-top-left"
                  style={{ width: "200%", height: "200%", transform: "scale(0.5)", border: "0" }}
                />
              </div>
            </figure>
            <div className="mt-3.5 flex items-baseline justify-between">
              <span className="text-sm font-semibold" style={{ fontFamily: "'Inter', sans-serif" }}>
                Prime Bins
              </span>
              <span
                className="text-[10px] tracking-[0.26em] text-[#2e9e58] uppercase"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Designed by ELSIAA · live — scroll it
              </span>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <figure className="overflow-hidden rounded-2xl border border-white/10 bg-[#0B2447] shadow-[0_40px_100px_-48px_rgba(0,0,0,0.85)]">
              <div className="flex items-center gap-2 border-b border-black/10 bg-[#F0F0EE] px-4 py-2.5">
                <span className="h-2 w-2 rounded-full bg-[#E5695E]" />
                <span className="h-2 w-2 rounded-full bg-[#E0A63F]" />
                <span className="h-2 w-2 rounded-full bg-[#57A85C]" />
                <span
                  className="mx-auto rounded-md bg-white px-4 py-0.5 text-[9px] tracking-[0.08em] text-black/45"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  mr-bins · original
                </span>
                <span className="h-2 w-6" />
              </div>
              <div className="h-[380px] overflow-hidden md:h-[46svh]">
                <iframe
                  src="https://isya-stack.github.io/mr-bins-website-/"
                  title="Mr. Bins — original website (live site)"
                  loading="lazy"
                  className="origin-top-left"
                  style={{ width: "200%", height: "200%", transform: "scale(0.5)", border: "0" }}
                />
              </div>
            </figure>
            <div className="mt-3.5 flex items-baseline justify-between">
              <span className="text-sm font-semibold" style={{ fontFamily: "'Inter', sans-serif" }}>
                Mr. Bins
              </span>
              <span
                className="text-[10px] tracking-[0.26em] text-white/40 uppercase"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Original · live — scroll it
              </span>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-y-8 divide-black/0 sm:grid-cols-3 sm:divide-x sm:divide-white/10 sm:gap-y-0">
            {[
              ["Hierarchy", "One message per screen — the offer is understood in three seconds."],
              ["Conversion", "Every scroll ends at the next obvious step; nothing competes with the sale."],
              ["Restraint", "Two typefaces, one accent, room to breathe — premium reads as trust."],
            ].map(([t, d]) => (
              <div key={t} className="sm:px-8 sm:first:pl-0 sm:last:pr-0">
                <p
                  className="text-[10px] tracking-[0.28em] text-[#2e9e58] uppercase"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {t}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-white/60" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {d}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mt-10 text-center">
            <a
              href="mailto:isya@elsiaa.com?subject=Design%20project%20inquiry"
              className="group inline-flex items-center gap-3 rounded-full border border-[#F5F5F3]/25 px-9 py-3.5 text-[11px] tracking-[0.3em] uppercase transition-colors duration-300 hover:border-[#2e9e58] hover:text-[#2e9e58]"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Discover more
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="mt-20 border-t border-white/[0.08] pt-12">
            <p
              className="text-center text-[10px] tracking-[0.34em] text-white/35 uppercase"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Trusted by the companies we&rsquo;ve built for
            </p>
            <div className="mx-auto mt-10 flex max-w-5xl flex-wrap items-center justify-center gap-x-14 gap-y-10">
              {[
                ["/assets/logos/mr_bins.png", "Mr. Bins", "h-7 md:h-8"],
                ["/assets/logos/dialog_healthcare.png", "Dialog Healthcare", "h-5 md:h-6"],
                ["/assets/logos/first_medcare.png", "First Medcare Inc", "h-8 md:h-9"],
                ["/assets/logos/excelsior.png", "Excelsior Healthcare Solutions", "h-6 md:h-7"],
                ["/assets/logos/hiddenlight.png", "HiddenLight ABA", "h-6 md:h-7"],
                ["/assets/logos/beyond_autism.png", "Beyond Autism Services", "h-10 md:h-12"],
                ["/assets/logos/kore_autism.png", "Kore Autism Services", "h-8 md:h-9"],
                ["/assets/logos/hidden_talents.png", "Hidden Talents ABA", "h-8 md:h-9"],
                ["/assets/logos/diet_fantasy.png", "The Diet Fantasy", "h-8 md:h-9"],
                ["/assets/logos/aaa.png", "AAA", "h-8 md:h-9"],
              ].map(([src, alt, h]) => (
                <img
                  key={src}
                  src={src}
                  alt={alt}
                  className={`${h} w-auto opacity-50 transition-opacity duration-300 hover:opacity-100`}
                  loading="lazy"
                />
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- 3 · website transformations ---------------- */
function MiniSite({ bad }: { bad?: boolean }) {
  return bad ? (
    <div className="h-full w-full space-y-1.5 bg-[#e9e6df] p-3">
      <div className="flex gap-1">
        <div className="h-2 w-10 bg-[#b6b0a3]" />
        <div className="h-2 w-6 bg-[#b6b0a3]" />
        <div className="h-2 w-8 bg-[#b6b0a3]" />
      </div>
      <div className="h-3 w-4/5 bg-[#8f887a]" />
      <div className="h-2 w-full bg-[#b6b0a3]" />
      <div className="h-2 w-full bg-[#b6b0a3]" />
      <div className="flex gap-1.5 pt-1">
        <div className="h-9 w-1/2 bg-[#c9c3b5]" />
        <div className="h-9 w-1/2 bg-[#c9c3b5]" />
      </div>
      <div className="h-2 w-2/3 bg-[#b6b0a3]" />
    </div>
  ) : (
    <div className="h-full w-full bg-white p-3">
      <div className="flex items-center justify-between">
        <div className="h-2 w-8 rounded-sm bg-[#111111]" />
        <div className="h-3.5 w-12 rounded-full bg-[#1e6b3c]" />
      </div>
      <div className="mt-3 h-3.5 w-3/5 rounded-sm bg-[#111111]" />
      <div className="mt-1.5 h-2 w-2/5 rounded-sm bg-black/20" />
      <div className="mt-3 flex gap-1.5">
        <div className="h-10 flex-1 rounded-md bg-[#1e6b3c]/12" />
        <div className="h-10 flex-1 rounded-md bg-[#1e6b3c]/25" />
        <div className="h-10 flex-1 rounded-md bg-[#1e6b3c]/40" />
      </div>
    </div>
  );
}

function Transformations() {
  const CASES = [
    { name: "EcomForge", desc: "Storefront rebuilt around a single conversion path — checkout friction cut in half." },
    { name: "FitPulse", desc: "A cluttered coaching site turned into one confident booking funnel." },
    { name: "LuxeNest", desc: "Property listings elevated to an editorial browsing experience." },
  ];
  return (
    <section className="border-t border-black/[0.06] bg-white px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p
            className="text-[11px] tracking-[0.34em] text-[#1e6b3c] uppercase"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Website transformations
          </p>
          <h2
            className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.02em] text-[#111111] md:text-5xl"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Real websites, completely uplifted.
          </h2>
          <p className="mt-3 max-w-xl text-base text-[#111111]/50" style={{ fontFamily: "'Inter', sans-serif" }}>
            Hover any card to watch the before become the after.
          </p>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {CASES.map((c, i) => (
            <Reveal key={c.name} delay={i * 0.08}>
              <div className="group">
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-black/[0.07] shadow-[0_18px_44px_-28px_rgba(17,17,17,0.35)]">
                  <MiniSite bad />
                  <div className="absolute inset-0 translate-y-full transition-transform duration-500 ease-[cubic-bezier(.22,.61,.36,1)] group-hover:translate-y-0">
                    <MiniSite />
                  </div>
                  <span
                    className="absolute top-2.5 left-2.5 rounded-full bg-black/60 px-2.5 py-1 text-[8px] tracking-[0.22em] text-white uppercase backdrop-blur transition-opacity duration-300 group-hover:opacity-0"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    Before
                  </span>
                  <span
                    className="absolute top-2.5 left-2.5 rounded-full bg-[#1e6b3c] px-2.5 py-1 text-[8px] tracking-[0.22em] text-white uppercase opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    After
                  </span>
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <h3 className="text-[15px] font-semibold text-[#111111]" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {c.name}
                  </h3>
                  <a
                    href="mailto:isya@elsiaa.com?subject=Case%20study%20request"
                    className="text-[10px] tracking-[0.22em] text-[#1e6b3c] uppercase transition-colors hover:text-[#2e9e58]"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    View case study →
                  </a>
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[#111111]/50" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {c.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- 4 · beyond websites ---------------- */
function PhonePreview() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#F5F5F3]">
      <div className="h-[78%] w-[34%] overflow-hidden rounded-[14px] border-[3px] border-[#111111] bg-white p-1.5 shadow-xl">
        <div className="bw-screens flex h-full w-[300%]">
          <div className="h-full w-1/3 space-y-1.5 pr-1">
            <div className="h-3 w-full rounded-sm bg-[#1e6b3c]" />
            <div className="h-1.5 w-4/5 rounded-sm bg-black/15" />
            <div className="h-8 w-full rounded-md bg-[#F5F5F3]" />
            <div className="h-1.5 w-3/5 rounded-sm bg-black/15" />
          </div>
          <div className="h-full w-1/3 space-y-1.5 pr-1">
            <div className="h-8 w-full rounded-md bg-[#2e9e58]/25" />
            <div className="h-1.5 w-full rounded-sm bg-black/15" />
            <div className="h-3 w-1/2 rounded-sm bg-[#111111]" />
          </div>
          <div className="h-full w-1/3 space-y-1.5">
            <div className="h-1.5 w-full rounded-sm bg-black/15" />
            <div className="h-1.5 w-3/4 rounded-sm bg-black/15" />
            <div className="h-5 w-full rounded-full bg-[#1e6b3c]" />
          </div>
        </div>
      </div>
      <style>{`
        @keyframes bwScreens { 0%,28% { transform: translateX(0) } 33%,61% { transform: translateX(-33.34%) } 66%,94% { transform: translateX(-66.67%) } 100% { transform: translateX(0) } }
        .bw-screens { animation: bwScreens 7s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .bw-screens { animation: none } }
      `}</style>
    </div>
  );
}

function BeyondWebsites() {
  return (
    <section className="bg-white px-6 pb-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p
            className="text-[11px] tracking-[0.34em] text-[#1e6b3c] uppercase"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Beyond websites
          </p>
          <h2
            className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.02em] text-[#111111] md:text-5xl"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Every surface your brand touches.
          </h2>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          <Reveal>
            <div className="group">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                <img src="/assets/laptop_bad_v1.jpg" alt="Ad creative before ELSIAA" className="absolute inset-0 h-full w-full object-cover" />
                <img
                  src="/assets/laptop_premium_v1.jpg"
                  alt="High-performing ad creative by ELSIAA"
                  className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                />
              </div>
              <h3 className="mt-4 text-[15px] font-semibold text-[#111111]" style={{ fontFamily: "'Inter', sans-serif" }}>
                Ad Campaigns
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#111111]/50" style={{ fontFamily: "'Inter', sans-serif" }}>
                Performance creative for Meta, Google, and beyond — hover to watch an
                amateur shot become the ad.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="group">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#070907]">
                <img
                  src="/assets/work_identity.jpg"
                  alt="ELSIAA constellation lion brand identity on merch and packaging"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                />
              </div>
              <h3 className="mt-4 text-[15px] font-semibold text-[#111111]" style={{ fontFamily: "'Inter', sans-serif" }}>
                Merch &amp; Branding
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#111111]/50" style={{ fontFamily: "'Inter', sans-serif" }}>
                Identity systems that survive every application — cards, packaging,
                apparel, environments.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.16}>
            <div className="group">
              <div className="aspect-[4/3] overflow-hidden rounded-xl border border-black/[0.06]">
                <PhonePreview />
              </div>
              <h3 className="mt-4 text-[15px] font-semibold text-[#111111]" style={{ fontFamily: "'Inter', sans-serif" }}>
                App Design
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#111111]/50" style={{ fontFamily: "'Inter', sans-serif" }}>
                Mobile UI/UX with platform-correct patterns — flows your developers can
                actually ship.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------------- 5 · results ---------------- */
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setStarted(true)),
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!started || !ref.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      ref.current.textContent = `${to}${suffix}`;
      return;
    }
    const t0 = performance.now();
    const dur = 1400;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      if (ref.current) ref.current.textContent = `${Math.round(to * e)}${suffix}`;
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, to, suffix]);
  return <span ref={ref}>0{suffix}</span>;
}

function Results() {
  return (
    <section className="border-t border-black/[0.06] bg-white px-6 py-24">
      <div className="mx-auto grid max-w-5xl grid-cols-3 gap-8 text-center">
        {[
          { n: 6, s: "", l: "Cities worldwide" },
          { n: 25, s: "+", l: "Design disciplines" },
          { n: 1, s: "", l: "Standard: excellence" },
        ].map((x) => (
          <Reveal key={x.l}>
            <p
              className="text-5xl font-semibold tracking-[-0.03em] text-[#111111] md:text-7xl"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <Counter to={x.n} suffix={x.s} />
            </p>
            <p
              className="mt-3 text-[10px] tracking-[0.28em] text-[#111111]/40 uppercase"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {x.l}
            </p>
          </Reveal>
        ))}
      </div>
      <Reveal delay={0.1}>
        <p
          className="mt-16 text-center text-[10px] tracking-[0.24em] text-[#111111]/35 uppercase"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          Antwerp · Geneva · London · Tel Aviv · New York · Los Angeles
        </p>
      </Reveal>
    </section>
  );
}

/* ---------------- 6 · final CTA ---------------- */
function FinalCTA() {
  return (
    <section className="bg-[#070907] px-6 py-32 text-center text-[#F5F5F3]">
      <Reveal>
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
          Ready to uplift your brand?
        </h2>
        <a
          href="mailto:isya@elsiaa.com?subject=Strategy%20call%20request"
          className="group mt-12 inline-flex items-center gap-3 border border-[#F5F5F3]/25 px-9 py-3.5 text-[11px] tracking-[0.3em] uppercase transition-colors duration-300 hover:border-[#2e9e58] hover:text-[#2e9e58]"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Book a strategy call
          <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
        </a>
        <p
          className="mt-16 text-sm italic text-[#F5F5F3]/40"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Omnia possibilia
        </p>
      </Reveal>
    </section>
  );
}

/* ---------------- assembled ---------------- */
export function DesignsShowcase() {
  return (
    <>
      <Statement />
      <DiscoverDesigns />
      <Transformations />
      <BeyondWebsites />
      <Results />
      <FinalCTA />
    </>
  );
}
