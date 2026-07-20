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

/* ---------------- lazy iframe — loads only when approaching viewport ---------------- */
function LazyFrame({
  src,
  title,
  interactive = true,
  native = false,
}: {
  src: string;
  title: string;
  interactive?: boolean;
  native?: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [load, setLoad] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && (setLoad(true), io.disconnect())),
      { rootMargin: "600px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className="h-full w-full">
      {load ? (
        <iframe
          src={src}
          title={title}
          loading="lazy"
          className={`origin-top-left ${interactive ? "" : "pointer-events-none"}`}
          style={
            native
              ? { width: "100%", height: "100%", border: "0" }
              : { width: "200%", height: "200%", transform: "scale(0.5)", border: "0" }
          }
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[#ECECEA]">
          <span
            className="text-[10px] tracking-[0.3em] text-black/30 uppercase"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Loading live site…
          </span>
        </div>
      )}
    </div>
  );
}

/* ---------------- drag-to-compare: ELSIAA design wipes over the original ---------------- */
function CompareSlider() {
  const [pct, setPct] = useState(50);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);
  const move = (clientX: number) => {
    const r = boxRef.current?.getBoundingClientRect();
    if (!r) return;
    setPct(Math.min(96, Math.max(4, ((clientX - r.left) / r.width) * 100)));
  };
  return (
    <Reveal delay={0.1}>
      <div className="mx-auto mt-16 hidden max-w-5xl lg:block">
        <p
          className="text-center text-[10px] tracking-[0.3em] text-[#111111]/40 uppercase"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          Feel it yourself — drag the line
        </p>
        <div
          ref={boxRef}
          className="relative mt-6 aspect-[16/9] cursor-ew-resize touch-none overflow-hidden rounded-2xl border border-black/10 shadow-[0_50px_110px_-50px_rgba(17,17,17,0.5)] select-none"
          onPointerDown={(e) => {
            dragging.current = true;
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
            move(e.clientX);
          }}
          onPointerMove={(e) => dragging.current && move(e.clientX)}
          onPointerUp={() => (dragging.current = false)}
        >
          <div className="absolute inset-0">
            <LazyFrame src="https://primebins.com" title="Prime Bins original — compare" interactive={false} />
          </div>
          <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}>
            <LazyFrame src="https://isya-stack.github.io/mr-bins-website-/" title="Mr. Bins by ELSIAA — compare" interactive={false} native />
          </div>
          <div className="pointer-events-none absolute top-0 bottom-0" style={{ left: `${pct}%` }}>
            <div className="absolute top-0 bottom-0 -left-px w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,0.5)]" />
            <div className="absolute top-1/2 left-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-[0_10px_28px_-6px_rgba(17,17,17,0.5)]">
              <span className="text-[13px] font-bold text-[#111111]">⇔</span>
            </div>
          </div>
          <span
            className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-[#1e6b3c] px-3 py-1 text-[9px] font-bold tracking-[0.2em] text-white uppercase"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            ELSIAA
          </span>
          <span
            className="pointer-events-none absolute right-3 bottom-3 rounded-full bg-black/55 px-3 py-1 text-[9px] font-bold tracking-[0.2em] text-white/85 uppercase backdrop-blur"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Original
          </span>
        </div>
      </div>
    </Reveal>
  );
}

/* ---------------- 1 · statement — kinetic type rising out of the cartoon ---------------- */
function KineticLine({ text, className }: { text: string; className: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.querySelectorAll("span").forEach((w) => {
        (w as HTMLElement).style.opacity = "1";
        (w as HTMLElement).style.transform = "none";
      });
      return;
    }
    let raf = 0;
    const words = Array.from(el.querySelectorAll("span")) as HTMLElement[];
    const tick = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const base = Math.min(1, Math.max(0, (vh * 0.92 - r.top) / (vh * 0.55)));
      words.forEach((w, i) => {
        const t = Math.min(1, Math.max(0, base * (words.length + 2) - i) / 2);
        const e = 1 - Math.pow(1 - t, 3);
        w.style.opacity = String(e);
        w.style.transform = `translateY(${(1 - e) * 34}px)`;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <span ref={ref} className={className}>
      {text.split(" ").map((w, i) => (
        <span key={i} className="inline-block will-change-transform" style={{ opacity: 0 }}>
          {w}
          {"\u00A0"}
        </span>
      ))}
    </span>
  );
}

function Magnetic({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  return (
    <div
      ref={ref}
      className="inline-block transition-transform duration-200 ease-out"
      onPointerMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.18;
        const y = (e.clientY - r.top - r.height / 2) * 0.3;
        el.style.transform = `translate(${x}px, ${y}px)`;
      }}
      onPointerLeave={() => {
        if (ref.current) ref.current.style.transform = "translate(0,0)";
      }}
    >
      {children}
    </div>
  );
}

function Statement() {
  return (
    <section className="flex min-h-[64svh] flex-col items-center justify-center bg-white px-6 pb-14 text-center">
      <h2
        className="mx-auto max-w-4xl text-4xl font-semibold tracking-[-0.03em] text-[#111111] md:text-7xl md:leading-[1.03]"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <KineticLine text="We don’t just design websites —" className="block" />
        <KineticLine text="we uplift brands." className="block" />
      </h2>
      <Reveal delay={0.1}>
        <p
          className="mx-auto mt-6 max-w-xl text-lg text-[#111111]/50 md:text-xl"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          From outdated to outstanding.
        </p>
      </Reveal>
      <Reveal delay={0.18}>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Magnetic>
            <a
              href="#discover-designs"
              className="rounded-full border border-[#111111] bg-[#111111] px-8 py-3.5 text-[11px] tracking-[0.28em] text-white uppercase transition-colors duration-300 hover:bg-[#1e6b3c] hover:border-[#1e6b3c]"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Explore our work
            </a>
          </Magnetic>
          <Magnetic>
            <a
              href="mailto:isya@elsiaa.com?subject=Design%20project%20inquiry"
              className="rounded-full border border-[#111111]/25 px-8 py-3.5 text-[11px] tracking-[0.28em] text-[#111111] uppercase transition-colors duration-300 hover:border-[#1e6b3c] hover:text-[#1e6b3c]"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Start your project
            </a>
          </Magnetic>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------------- 2 · discover designs — the hero comparison ---------------- */
function SideToggle({
  side,
  setSide,
}: {
  side: "after" | "before";
  setSide: (s: "after" | "before") => void;
}) {
  return (
    <div className="mt-8 flex justify-center lg:hidden">
      <div className="flex rounded-full border border-black/10 bg-white p-1 shadow-sm">
        {(["after", "before"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setSide(k)}
            className={`rounded-full px-5 py-2 text-[10px] font-bold tracking-[0.2em] uppercase transition-all ${
              side === k ? (k === "after" ? "bg-[#1e6b3c] text-white" : "bg-[#111111] text-white") : "text-black/45"
            }`}
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            {k === "after" ? "After — ELSIAA" : "Before"}
          </button>
        ))}
      </div>
    </div>
  );
}

function DiscoverDesigns() {
  const [side, setSide] = useState<"after" | "before">("after");
  return (
    <section id="discover-designs" className="bg-[#F5F5F3] px-6 py-24 text-[#111111]">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p
            className="text-center text-[11px] tracking-[0.34em] text-[#1e6b3c] uppercase"
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
            className="mx-auto mt-3 max-w-xl text-center text-base text-[#111111]/50 md:text-xl"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            What kind of impression are you making?
          </p>
        </Reveal>
        <SideToggle side={side} setSide={setSide} />

        <div className="relative mt-12 grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div className="pointer-events-none absolute top-[38%] left-1/2 z-20 hidden -translate-x-1/2 items-center justify-center lg:flex">
            <span
              className="flex h-16 w-16 items-center justify-center rounded-full border border-black/10 bg-white text-sm font-bold tracking-[0.1em] text-[#111111] shadow-[0_16px_40px_-12px_rgba(17,17,17,0.35)]"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              VS
            </span>
          </div>
          <Reveal delay={0.05} className={`${side === "before" ? "block" : "hidden"} lg:block`}>
            <figure className="relative overflow-hidden rounded-2xl border border-black/10 bg-white opacity-[0.92] saturate-[0.85] shadow-[0_40px_90px_-50px_rgba(17,17,17,0.4)] transition-all duration-300 hover:opacity-100 hover:saturate-100">
              <div
                className="pointer-events-none absolute top-14 left-4 z-10 rounded-full bg-black/55 px-4 py-1.5 text-[10px] font-bold tracking-[0.24em] text-white/85 uppercase shadow-lg backdrop-blur"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Before
              </div>
              <div className="pointer-events-none absolute top-14 right-4 z-10 flex items-center gap-2 rounded-full bg-[#1e6b3c] px-3.5 py-1.5 shadow-lg">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                </span>
                <span className="text-[9px] font-semibold tracking-[0.22em] text-white uppercase" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  Live — scroll &amp; click
                </span>
              </div>

              <div className="flex items-center gap-2 border-b border-black/10 bg-[#F0F0EE] px-4 py-2.5">
                <span className="h-2 w-2 rounded-full bg-[#E5695E]" />
                <span className="h-2 w-2 rounded-full bg-[#E0A63F]" />
                <span className="h-2 w-2 rounded-full bg-[#57A85C]" />
                <span
                  className="mx-auto rounded-md bg-white px-4 py-0.5 text-[9px] tracking-[0.08em] text-black/45"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  primebins.com · original
                </span>
                <span className="h-2 w-6" />
              </div>
              <div className="h-[560px] overflow-hidden md:h-[76svh]">
                <LazyFrame src="https://primebins.com" title="Prime Bins — original website (live site)" />
              </div>
            </figure>
            <div className="mt-3.5 flex items-baseline justify-between">
              <span className="text-sm font-semibold" style={{ fontFamily: "'Inter', sans-serif" }}>
                Prime Bins
              </span>
              <span
                className="text-[10px] tracking-[0.26em] text-[#111111]/40 uppercase"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Original · fully interactive
              </span>
              <a
                href="https://primebins.com"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] tracking-[0.2em] text-[#111111]/45 uppercase underline-offset-4 hover:underline"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Open ↗
              </a>
            </div>
            <ul className="mt-4 space-y-2">
              {[
                "Message competes with itself on the first screen",
                "No single path from interest to action",
                "Busy visuals working against the sale",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-[13px] text-[#111111]/45" style={{ fontFamily: "'Inter', sans-serif" }}>
                  <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-black/20 text-[9px] font-bold text-white">✕</span>
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.15} className={`${side === "after" ? "block" : "hidden"} lg:block`}>
            <figure className="relative overflow-hidden rounded-2xl border-2 border-[#1e6b3c] bg-[#0B2447] shadow-[0_60px_130px_-45px_rgba(30,107,60,0.55)] ring-4 ring-[#1e6b3c]/10">
              <div
                className="pointer-events-none absolute top-14 left-4 z-10 rounded-full bg-[#1e6b3c] px-4 py-1.5 text-[10px] font-bold tracking-[0.24em] text-white uppercase shadow-lg"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                After — ELSIAA
              </div>
              <div className="pointer-events-none absolute top-14 right-4 z-10 flex items-center gap-2 rounded-full bg-[#1e6b3c] px-3.5 py-1.5 shadow-lg">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                </span>
                <span className="text-[9px] font-semibold tracking-[0.22em] text-white uppercase" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  Live — scroll &amp; click
                </span>
              </div>

              <div className="flex items-center gap-2 border-b border-black/10 bg-[#F0F0EE] px-4 py-2.5">
                <span className="h-2 w-2 rounded-full bg-[#E5695E]" />
                <span className="h-2 w-2 rounded-full bg-[#E0A63F]" />
                <span className="h-2 w-2 rounded-full bg-[#57A85C]" />
                <span
                  className="mx-auto rounded-md bg-white px-4 py-0.5 text-[9px] tracking-[0.08em] text-black/45"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  mr. bins · by ELSIAA
                </span>
                <span className="h-2 w-6" />
              </div>
              <div className="h-[560px] overflow-hidden md:h-[76svh]">
                <LazyFrame src="https://isya-stack.github.io/mr-bins-website-/" title="Mr. Bins — designed by ELSIAA (live site)" native />
              </div>
            </figure>
            <div className="mt-3.5 flex items-baseline justify-between">
              <span className="text-sm font-semibold" style={{ fontFamily: "'Inter', sans-serif" }}>
                Mr. Bins
              </span>
              <span
                className="text-[10px] tracking-[0.26em] text-[#1e6b3c] uppercase"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Designed by ELSIAA · fully interactive
              </span>
              <a
                href="https://isya-stack.github.io/mr-bins-website-/"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] tracking-[0.2em] text-[#1e6b3c] uppercase underline-offset-4 hover:underline"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Open ↗
              </a>
            </div>
            <ul className="mt-4 space-y-2">
              {[
                "The offer is understood in three seconds",
                "Every scroll ends at the next obvious step",
                "Premium restraint — design that earns trust",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-[13px] text-[#111111]/70" style={{ fontFamily: "'Inter', sans-serif" }}>
                  <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-[#1e6b3c] text-[9px] font-bold text-white">✓</span>
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <CompareSlider />



      </div>
    </section>
  );
}

/* ---------------- 3b · discover apps — interactive phone face-off ---------------- */
function PhoneShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto h-[540px] w-[264px] rounded-[38px] border-[6px] border-[#111111] bg-white shadow-[0_50px_110px_-45px_rgba(17,17,17,0.5)]">
      <div className="relative h-full w-full overflow-hidden rounded-[32px]">
        <div className="absolute top-2 left-1/2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-[#111111]" />
        {children}
      </div>
    </div>
  );
}

function AfterApp() {
  const [tab, setTab] = useState(0);
  const [added, setAdded] = useState(false);
  return (
    <div className="flex h-full flex-col bg-[#FBFBFA] pt-9" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between px-4 pb-2">
        <span className="text-[12px] font-bold tracking-tight text-[#111111]">
          Prime<span className="text-[#1e6b3c]">Bins</span>
        </span>
        <span className="rounded-full bg-[#1e6b3c] px-2.5 py-1 text-[8px] font-bold tracking-[0.12em] text-white uppercase">
          Today $11
        </span>
      </div>
      <div className="flex-1 overflow-hidden px-4">
        {tab === 0 && (
          <div className="space-y-2.5">
            <p className="text-[17px] leading-tight font-semibold tracking-[-0.02em] text-[#111111]">
              The price drops
              <br />
              every day.
            </p>
            <div className="flex items-end gap-1">
              {[14, 13, 12, 11, 10, 9].map((p, i) => (
                <div key={p} className="flex flex-1 flex-col items-center gap-0.5">
                  <span className={`text-[8px] font-bold ${i === 3 ? "text-[#1e6b3c]" : "text-black/45"}`}>${p}</span>
                  <div className={`w-full rounded-t-sm ${i === 3 ? "bg-[#1e6b3c]" : "bg-black/[0.08]"}`} style={{ height: 46 - i * 6 }} />
                </div>
              ))}
            </div>
            <button
              onClick={() => setAdded(!added)}
              className={`w-full rounded-full py-2.5 text-[10px] font-bold tracking-[0.16em] uppercase transition-all duration-300 ${
                added ? "bg-[#1e6b3c] text-white" : "bg-[#111111] text-white active:scale-[0.98]"
              }`}
            >
              {added ? "✓ Reminder set for $9 day" : "Remind me on $9 day"}
            </button>
            <div className="rounded-xl bg-white p-3 shadow-sm">
              <p className="text-[10px] font-semibold text-[#111111]">Wilkes-Barre · open now</p>
              <p className="mt-0.5 text-[9px] text-black/45">Fresh restock Saturday — 40 bins</p>
            </div>
          </div>
        )}
        {tab === 1 && (
          <div className="space-y-2">
            <p className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111]">This week&rsquo;s bins</p>
            {["Electronics", "Home & Kitchen", "Toys & Games"].map((c) => (
              <div key={c} className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm">
                <span className="text-[10px] font-semibold text-[#111111]">{c}</span>
                <span className="text-[9px] font-bold text-[#1e6b3c]">$11</span>
              </div>
            ))}
          </div>
        )}
        {tab === 2 && (
          <div className="space-y-2.5">
            <p className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111]">Loyalty card</p>
            <div className="rounded-xl bg-[#111111] p-3.5 text-white">
              <p className="text-[9px] tracking-[0.2em] uppercase opacity-60">Member</p>
              <p className="mt-2 text-[12px] font-semibold">4 digs → free mystery box</p>
              <div className="mt-2 flex gap-1">
                {[1, 1, 1, 1, 0, 0].map((f, i) => (
                  <span key={i} className={`h-1.5 flex-1 rounded-full ${f ? "bg-[#2e9e58]" : "bg-white/20"}`} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="flex border-t border-black/[0.06] bg-white">
        {["Home", "Bins", "Card"].map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`flex-1 py-3 text-[9px] font-semibold tracking-[0.12em] uppercase transition-colors ${
              tab === i ? "text-[#1e6b3c]" : "text-black/35"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

function BeforeApp() {
  const [tab, setTab] = useState(0);
  return (
    <div className="flex h-full flex-col bg-[#dfe4ea] pt-9" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="bg-[#0B2447] px-3 py-2">
        <p className="text-[11px] font-bold tracking-wide text-white">MR BINS OFFICIAL APP</p>
        <p className="text-[8px] text-white/60">v2.3.1 — please update</p>
      </div>
      <div className="bg-[#FF8F52] px-3 py-1.5">
        <p className="text-[8px] font-bold text-[#0B2447]">🔥🔥 HUGE SALE!!! CLICK HERE NOW!!! 🔥🔥</p>
      </div>
      <div className="flex-1 overflow-hidden px-3 pt-2">
        {tab === 0 && (
          <div className="space-y-1.5">
            {["Home", "About Us", "Locations", "Pricing Info", "Loyalty Program", "Mystery Boxes", "Careers", "Contact Us", "FAQ", "Terms"].map((m) => (
              <div key={m} className="flex items-center justify-between border-b border-black/10 bg-white px-2.5 py-1.5">
                <span className="text-[9px] text-[#0B2447]">{m}</span>
                <span className="text-[9px] text-black/30">›</span>
              </div>
            ))}
          </div>
        )}
        {tab === 1 && (
          <div className="space-y-1.5">
            <div className="bg-white p-2">
              <p className="text-[9px] leading-relaxed text-[#333]">
                Welcome to the deals page. Deals are updated periodically. Check back
                often for the latest deals and promotions. Terms and conditions apply
                to all offers...
              </p>
            </div>
            <div className="bg-[#c9d2dd] p-2 text-center">
              <p className="text-[8px] text-black/50">[ banner advertisement ]</p>
            </div>
          </div>
        )}
        {tab === 2 && (
          <div className="bg-white p-2.5">
            <p className="text-[9px] font-bold text-[#0B2447]">LOGIN REQUIRED</p>
            <p className="mt-1 text-[8px] leading-relaxed text-black/50">
              Please create an account or log in to view your loyalty status. Password
              must contain 12 characters...
            </p>
            <div className="mt-2 h-5 w-full border border-black/20 bg-[#f4f4f4]" />
            <div className="mt-1.5 h-5 w-full border border-black/20 bg-[#f4f4f4]" />
          </div>
        )}
      </div>
      <div className="flex border-t border-black/15 bg-[#0B2447]">
        {["Menu", "Deals", "Account"].map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`flex-1 py-3 text-[9px] font-bold tracking-wide uppercase ${
              tab === i ? "text-[#FF8F52]" : "text-white/50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

function StoreBadges() {
  return (
    <div className="mt-5 flex items-center justify-center gap-3">
      {/* App Store */}
      <a
        href="mailto:isya@elsiaa.com?subject=App%20design%20inquiry"
        className="flex items-center gap-2.5 rounded-lg bg-[#111111] px-4 py-2 text-white transition-transform duration-200 hover:scale-[1.04]"
        aria-label="Download on the App Store"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white" aria-hidden>
          <path d="M17.05 12.54c-.03-2.89 2.36-4.27 2.47-4.34-1.35-1.97-3.44-2.24-4.18-2.27-1.78-.18-3.47 1.05-4.37 1.05-.9 0-2.29-1.02-3.77-1-1.94.03-3.72 1.13-4.72 2.86-2.01 3.49-.51 8.66 1.45 11.49.96 1.39 2.1 2.94 3.6 2.88 1.44-.06 1.99-.93 3.73-.93s2.23.93 3.76.9c1.55-.03 2.53-1.41 3.48-2.8 1.1-1.61 1.55-3.17 1.57-3.25-.03-.02-3.01-1.16-3.02-4.59zM14.17 4.06c.8-.96 1.33-2.3 1.18-3.64-1.14.05-2.53.76-3.35 1.72-.73.85-1.38 2.21-1.2 3.52 1.27.1 2.58-.65 3.37-1.6z" />
        </svg>
        <span className="text-left leading-none">
          <span className="block text-[8px] opacity-70">Download on the</span>
          <span className="block text-[13px] font-semibold">App Store</span>
        </span>
      </a>
      {/* Google Play */}
      <a
        href="mailto:isya@elsiaa.com?subject=App%20design%20inquiry"
        className="flex items-center gap-2.5 rounded-lg bg-[#111111] px-4 py-2 text-white transition-transform duration-200 hover:scale-[1.04]"
        aria-label="Get it on Google Play"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
          <path d="M3.6 1.8 13.7 12 3.6 22.2c-.37-.2-.6-.6-.6-1.1V2.9c0-.5.23-.9.6-1.1z" fill="#00D2FF" />
          <path d="m17.3 8.4-13-7.3c.14-.06.3-.1.46-.1.23 0 .46.06.67.18L17.9 7.8l-.6.6z" fill="#00F076" />
          <path d="M17.3 15.6 13.7 12l3.6-3.6 3.16 1.78c.98.55.98 1.09 0 1.64L17.3 15.6z" fill="#FFC900" />
          <path d="m17.3 15.6-.6-.6L5.03 22.82c-.4.23-.83.24-1.13.08l13.4-7.3z" fill="#F63448" />
        </svg>
        <span className="text-left leading-none">
          <span className="block text-[8px] opacity-70">Get it on</span>
          <span className="block text-[13px] font-semibold">Google Play</span>
        </span>
      </a>
    </div>
  );
}

function DiscoverApps() {
  const [side, setSide] = useState<"after" | "before">("after");
  const liveBadge = (
    <div className="pointer-events-none absolute -bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#1e6b3c] px-3.5 py-1.5 whitespace-nowrap shadow-lg">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
      </span>
      <span className="text-[9px] font-semibold tracking-[0.22em] text-white uppercase" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
        Live — tap it
      </span>
    </div>
  );
  return (
    <section className="bg-[#F5F5F3] px-6 pt-4 pb-24 text-[#111111]">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p
            className="text-center text-[11px] tracking-[0.34em] text-[#1e6b3c] uppercase"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Discover apps
          </p>
          <h2
            className="mx-auto mt-3 max-w-3xl text-center text-2xl font-semibold tracking-[-0.03em] md:text-4xl md:leading-[1.1]"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            It doesn&rsquo;t matter how good your backend is.
          </h2>
          <p
            className="mx-auto mt-3 max-w-2xl text-center text-base text-[#111111]/50 md:text-xl"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            If your target audience doesn&rsquo;t use your app because of poor design,
            the engineering never gets its chance.
          </p>
        </Reveal>
        <SideToggle side={side} setSide={setSide} />

        <div className="relative mt-14 grid grid-cols-1 gap-14 lg:grid-cols-2 lg:gap-10">
          <div className="pointer-events-none absolute top-[40%] left-1/2 z-20 hidden -translate-x-1/2 items-center justify-center lg:flex">
            <span
              className="flex h-16 w-16 items-center justify-center rounded-full border border-black/10 bg-white text-sm font-bold tracking-[0.1em] text-[#111111] shadow-[0_16px_40px_-12px_rgba(17,17,17,0.35)]"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              VS
            </span>
          </div>

          <Reveal delay={0.05} className={`${side === "after" ? "block" : "hidden"} lg:block`}>
            <div className="relative mx-auto w-fit">
              {liveBadge}
              <div
                className="pointer-events-none absolute -top-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[#1e6b3c] px-4 py-1.5 text-[10px] font-bold tracking-[0.24em] whitespace-nowrap text-white uppercase shadow-lg"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                After — ELSIAA
              </div>
              <div
                aria-hidden
                className="absolute top-1/2 left-1/2 -z-10 h-[120%] w-[150%] -translate-x-1/2 -translate-y-1/2"
                style={{ background: "radial-gradient(circle, rgba(46,158,88,0.16) 0%, transparent 62%)" }}
              />
              <div className="rounded-[44px] ring-4 ring-[#1e6b3c]/15">
                <PhoneShell>
                  <AfterApp />
                </PhoneShell>
              </div>
            </div>
            <ul className="mx-auto mt-6 max-w-xs space-y-2">
              {[
                "One glance answers the only question: today's price",
                "The core action is a single thumb-tap away",
                "Loyalty you can feel filling up",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-[13px] text-[#111111]/70" style={{ fontFamily: "'Inter', sans-serif" }}>
                  <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-[#1e6b3c] text-[9px] font-bold text-white">✓</span>
                  {t}
                </li>
              ))}
            </ul>
            <StoreBadges />
          </Reveal>

          <Reveal delay={0.15} className={`${side === "before" ? "block" : "hidden"} lg:block`}>
            <div className="relative mx-auto w-fit opacity-[0.92] saturate-[0.85] transition-all duration-300 hover:opacity-100 hover:saturate-100">
              {liveBadge}
              <div
                className="pointer-events-none absolute -top-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/55 px-4 py-1.5 text-[10px] font-bold tracking-[0.24em] whitespace-nowrap text-white/85 uppercase shadow-lg backdrop-blur"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Before
              </div>
              <PhoneShell>
                <BeforeApp />
              </PhoneShell>
            </div>
            <ul className="mx-auto mt-6 max-w-xs space-y-2">
              {[
                "A menu of links where a product should be",
                "The thing customers want is three taps deep",
                "Shouting banners instead of a reason to return",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-[13px] text-[#111111]/45" style={{ fontFamily: "'Inter', sans-serif" }}>
                  <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-black/20 text-[9px] font-bold text-white">✕</span>
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------------- client trust wall ---------------- */
function ClientLogos() {
  return (
    <section className="bg-[#F5F5F3] px-6 pb-24 text-[#111111]">
      <div className="mx-auto max-w-6xl">
        <Reveal delay={0.2}>
          <div className="border-t border-black/[0.08] pt-14">
            <p
              className="text-center text-[10px] tracking-[0.34em] text-[#111111]/40 uppercase"
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
                  className={`${h} w-auto opacity-55 transition-opacity duration-300 hover:opacity-100`}
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

/* ---------------- 3 · website transformations — real clients ---------------- */
type Mini = { name: string; before: React.JSX.Element; after: React.JSX.Element; desc: string };

const bar = (w: string, c: string, h = "h-2") => (
  <div className={`${h} ${w} rounded-sm`} style={{ backgroundColor: c }} />
);

const CASES: Mini[] = [
  {
    name: "Dialog Healthcare",
    desc: "A staffing site rebuilt around one promise — the right clinician, placed fast.",
    before: (
      <div className="h-full w-full space-y-1.5 bg-[#eef3f4] p-3">
        <div className="flex items-center justify-between">
          {bar("w-16", "#2a7f8a", "h-3")}
          <div className="flex gap-1">{bar("w-6", "#9db9bd")}{bar("w-6", "#9db9bd")}{bar("w-6", "#9db9bd")}{bar("w-6", "#9db9bd")}</div>
        </div>
        <div className="h-14 w-full rounded-sm bg-[#2a7f8a]/30 p-2">
          {bar("w-3/4", "#1d5a62", "h-3")}
          <div className="mt-1.5 flex gap-1">{bar("w-14", "#e08b3c", "h-4")}{bar("w-14", "#2a7f8a", "h-4")}</div>
        </div>
        <div className="flex gap-1.5">
          <div className="h-10 flex-1 rounded-sm bg-[#c8d8da]" />
          <div className="h-10 flex-1 rounded-sm bg-[#c8d8da]" />
          <div className="h-10 flex-1 rounded-sm bg-[#c8d8da]" />
        </div>
        {bar("w-full", "#b3c6c9")}
        {bar("w-5/6", "#b3c6c9")}
      </div>
    ),
    after: (
      <div className="h-full w-full bg-white p-3" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold tracking-tight text-[#111111]">Dialog<span className="text-[#111111]/45"> Healthcare</span></span>
          <span className="rounded-full bg-[#1e6b3c] px-2.5 py-0.5 text-[7px] font-semibold tracking-[0.14em] text-white uppercase">Request staff</span>
        </div>
        <p className="mt-3 text-[13px] leading-tight font-semibold tracking-[-0.02em] text-[#111111]">The right clinician.<br />Placed in days, not months.</p>
        <div className="mt-2 flex gap-1">{bar("w-16", "#111111", "h-4")}{bar("w-12", "#e8e8e6", "h-4")}</div>
        <div className="mt-2.5 grid grid-cols-3 gap-1.5">
          <div className="rounded-md bg-[#F5F5F3] p-1.5">{bar("w-3/4", "#1e6b3c", "h-1.5")}<div className="mt-1">{bar("w-full", "#d8d8d5", "h-1")}</div></div>
          <div className="rounded-md bg-[#F5F5F3] p-1.5">{bar("w-3/4", "#1e6b3c", "h-1.5")}<div className="mt-1">{bar("w-full", "#d8d8d5", "h-1")}</div></div>
          <div className="rounded-md bg-[#F5F5F3] p-1.5">{bar("w-3/4", "#1e6b3c", "h-1.5")}<div className="mt-1">{bar("w-full", "#d8d8d5", "h-1")}</div></div>
        </div>
      </div>
    ),
  },
  {
    name: "PSI Construction",
    desc: "A contractor's credibility, poured in concrete — portfolio first, paperwork last.",
    before: (
      <div className="h-full w-full space-y-1.5 bg-[#f3efe6] p-3">
        <div className="flex items-center justify-between">
          {bar("w-14", "#c9a227", "h-3.5")}
          <div className="flex gap-1">{bar("w-7", "#8f8873")}{bar("w-7", "#8f8873")}{bar("w-7", "#8f8873")}</div>
        </div>
        <div className="h-12 w-full rounded-sm bg-[#3d3a33] p-2">{bar("w-2/3", "#c9a227", "h-3")}<div className="mt-1">{bar("w-1/2", "#6e685c", "h-2")}</div></div>
        <div className="flex gap-1.5">
          <div className="h-9 flex-1 rounded-sm bg-[#d9d2c0]" />
          <div className="h-9 flex-1 rounded-sm bg-[#d9d2c0]" />
        </div>
        {bar("w-full", "#c5bda7")}
        {bar("w-4/5", "#c5bda7")}
        {bar("w-5/6", "#c5bda7")}
      </div>
    ),
    after: (
      <div className="h-full w-full bg-[#15140f] p-3 text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold tracking-[0.2em] uppercase">PSI<span className="text-[#d9a441]"> Construction</span></span>
          <span className="rounded-full border border-white/25 px-2.5 py-0.5 text-[7px] font-semibold tracking-[0.14em] uppercase">Get a bid</span>
        </div>
        <p className="mt-3 text-[13px] leading-tight font-semibold tracking-[-0.02em]">Built to outlast<br />the blueprint.</p>
        <div className="mt-2.5 grid grid-cols-3 gap-1.5">
          <div className="aspect-[4/3] rounded-md bg-gradient-to-br from-[#3a372e] to-[#23211b]" />
          <div className="aspect-[4/3] rounded-md bg-gradient-to-br from-[#4a4638] to-[#2a2820]" />
          <div className="aspect-[4/3] rounded-md bg-gradient-to-br from-[#5a5443] to-[#312e24]" />
        </div>
        <div className="mt-2 flex items-center gap-1.5">{bar("w-10", "#d9a441", "h-1.5")}{bar("w-16", "rgba(255,255,255,0.25)", "h-1.5")}</div>
      </div>
    ),
  },
  {
    name: "Michael Elbaz Law",
    desc: "Counsel that reads like counsel — an editorial presence that wins trust before the first call.",
    before: (
      <div className="h-full w-full space-y-1.5 bg-[#e9ecf2] p-3">
        <div className="flex items-center justify-between">
          {bar("w-20", "#1f3864", "h-3")}
          <div className="flex gap-1">{bar("w-6", "#8d99b3")}{bar("w-6", "#8d99b3")}{bar("w-6", "#8d99b3")}{bar("w-6", "#8d99b3")}{bar("w-6", "#8d99b3")}</div>
        </div>
        <div className="h-12 w-full rounded-sm bg-[#1f3864]/85 p-2">{bar("w-3/5", "#c9a227", "h-2.5")}<div className="mt-1">{bar("w-2/5", "#5a6f96", "h-2")}</div></div>
        {bar("w-full", "#b9c1d2")}
        {bar("w-full", "#b9c1d2")}
        {bar("w-3/4", "#b9c1d2")}
        <div className="flex gap-1.5 pt-0.5"><div className="h-8 flex-1 rounded-sm bg-[#ccd3e0]" /><div className="h-8 flex-1 rounded-sm bg-[#ccd3e0]" /></div>
      </div>
    ),
    after: (
      <div className="h-full w-full bg-[#FBFAF7] p-3" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-semibold tracking-[0.12em] text-[#14140f]" style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "11px" }}>
            Michael Elbaz Law
          </span>
          <span className="rounded-full bg-[#14140f] px-2.5 py-0.5 text-[7px] font-semibold tracking-[0.14em] text-white uppercase">Consultation</span>
        </div>
        <p className="mt-3 text-[13px] leading-snug text-[#14140f]" style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "15px" }}>
          Clarity, in your corner.
        </p>
        <div className="mt-1.5">{bar("w-3/4", "#dedbd2", "h-1.5")}</div>
        <div className="mt-0.5">{bar("w-2/3", "#dedbd2", "h-1.5")}</div>
        <div className="mt-2.5 flex gap-1.5">
          <div className="flex-1 border-t border-[#14140f]/20 pt-1">{bar("w-3/4", "#14140f", "h-1.5")}<div className="mt-1">{bar("w-full", "#dedbd2", "h-1")}</div></div>
          <div className="flex-1 border-t border-[#14140f]/20 pt-1">{bar("w-3/4", "#14140f", "h-1.5")}<div className="mt-1">{bar("w-full", "#dedbd2", "h-1")}</div></div>
          <div className="flex-1 border-t border-[#14140f]/20 pt-1">{bar("w-3/4", "#14140f", "h-1.5")}<div className="mt-1">{bar("w-full", "#dedbd2", "h-1")}</div></div>
        </div>
      </div>
    ),
  },
];

function Transformations() {
  return (
    <section className="bg-[#F5F5F3] px-6 pt-4 pb-20 text-[#111111]">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p
            className="text-[11px] tracking-[0.34em] text-[#1e6b3c] uppercase"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Website transformations
          </p>
          <h2
            className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.02em] md:text-5xl"
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
              <div
                className="group"
                onClick={(e) => {
                  const el = (e.currentTarget as HTMLElement).querySelector("[data-after]") as HTMLElement | null;
                  if (el) el.classList.toggle("!translate-y-0");
                }}
              >
                <div className="relative aspect-[4/3] cursor-pointer overflow-hidden rounded-xl border border-black/[0.07] bg-white shadow-[0_18px_44px_-28px_rgba(17,17,17,0.3)]">
                  {c.before}
                  <div data-after className="absolute inset-0 translate-y-full transition-transform duration-500 ease-[cubic-bezier(.22,.61,.36,1)] group-hover:translate-y-0">
                    {c.after}
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
                    After — ELSIAA
                  </span>
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <h3 className="text-[15px] font-semibold" style={{ fontFamily: "'Inter', sans-serif" }}>
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
function PageProgress() {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const doc = document.documentElement;
      const p = Math.min(1, window.scrollY / Math.max(1, doc.scrollHeight - window.innerHeight));
      if (ref.current) ref.current.style.transform = `scaleX(${p})`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className="fixed inset-x-0 top-0 z-[60] h-[2.5px]">
      <div ref={ref} className="h-full origin-left bg-[#2e9e58]" style={{ transform: "scaleX(0)" }} />
    </div>
  );
}

export function DesignsShowcase() {
  return (
    <>
      <PageProgress />
      <style>{`
        ::selection { background: rgba(46,158,88,0.85); color: #fff; }
        html { scroll-behavior: smooth; }
      `}</style>
      <Statement />
      <DiscoverDesigns />
      <Transformations />
      <DiscoverApps />
      <ClientLogos />
      <BeyondWebsites />
      <Results />
      <FinalCTA />
    </>
  );
}
