import { useEffect, useRef, useState } from "react";
import { Reveal } from "./Reveal";

/*
  ELSIAA Designs showcase — follows the cartoon opener.
  Statement → Discover Designs (live side-by-side: our Prime Bins uplift
  vs the original Mr. Bins site) → Transformations → Beyond Websites →
  Results → Final CTA. All reveals eased, scroll-pure, reduced-motion safe.
*/

/* ---------------- shared: eased in-view reveal ---------------- */

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
  zoom = 0.5,
  onFrame,
}: {
  src: string;
  title: string;
  interactive?: boolean;
  native?: boolean;
  zoom?: number;
  onFrame?: (el: HTMLIFrameElement | null) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [load, setLoad] = useState(false);
  const [gated, setGated] = useState(false);
  useEffect(() => {
    // phones: don't mount heavy live sites until the visitor asks
    if (window.matchMedia("(pointer: coarse) and (max-width: 767px)").matches) {
      setGated(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && (setLoad(true), io.disconnect())),
      { rootMargin: "600px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  if (gated && !load) {
    return (
      <button
        onClick={() => setLoad(true)}
        className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#f4f4f2]"
        aria-label={`Load ${title}`}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#111111] text-white">▶</span>
        <span className="text-[13px] text-[#111111]/55 " style={{ fontFamily: "var(--font-sans)" }}>
          Tap to explore live
        </span>
      </button>
    );
  }
  return (
    <div ref={ref} className="h-full w-full">
      {load ? (
        <iframe
          ref={(el) => onFrame?.(el)}
          src={src}
          title={title}
          loading="lazy"
          className={`origin-top-left ${interactive ? "" : "pointer-events-none"}`}
          style={
            native
              ? { width: "100%", height: "100%", border: "0" }
              : {
                  width: `${100 / zoom}%`,
                  height: `${100 / zoom}%`,
                  transform: `scale(${zoom})`,
                  border: "0",
                }
          }
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[#ECECEA]">
          <span
            className="text-[13px] text-black/50 "
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Loading live site…
          </span>
        </div>
      )}
    </div>
  );
}

/* ---------------- drag-to-compare: ELSIAA design wipes over the original ---------------- */
function DialogNewPreview() {
  return (
    <div className="flex h-full w-full flex-col bg-white" style={{ fontFamily: "var(--font-sans)" }}>
      <div className="flex items-center justify-between border-b border-black/5 px-8 py-5">
        <span className="text-lg font-bold tracking-tight text-[#111111]">
          Dialog<span className="text-[#111111]/55"> Healthcare</span>
        </span>
        <span className="rounded-full bg-[#1e6b3c] px-5 py-2 text-[13px] font-semibold text-white ">
          Request staff
        </span>
      </div>
      <div className="flex flex-1 flex-col justify-center px-8">
        <p
          className="text-[13px] text-[#1e6b3c] "
          style={{ fontFamily: "var(--font-sans)" }}
        >
          Healthcare staffing
        </p>
        <h3 className="mt-3 max-w-lg text-4xl leading-[1.05] font-semibold tracking-[-0.035em] text-[#111111] md:text-5xl">
          The right clinician.
          <br />
          Placed in days, not months.
        </h3>
        <div className="mt-6 flex gap-3">
          <div className="h-10 w-40 rounded-full bg-[#111111]" />
          <div className="h-10 w-32 rounded-full border border-black/15" />
        </div>
        <div className="mt-10 grid max-w-2xl grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="dhp-shimmer rounded-xl bg-[#F5F5F3] p-4" style={{ animationDelay: `${i * 0.25}s` }}>
              <div className="h-2 w-2/3 rounded bg-[#1e6b3c]/60" />
              <div className="mt-2.5 h-1.5 w-full rounded bg-black/10" />
              <div className="mt-1.5 h-1.5 w-4/5 rounded bg-black/10" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-black/5 px-8 py-4">
        <span
          className="text-[13px] text-black/50 "
          style={{ fontFamily: "var(--font-sans)" }}
        >
          New site · in production
        </span>
        <span
          className="rounded-full bg-[#1e6b3c]/10 px-3 py-1 text-[13px] font-bold text-[#1e6b3c] "
          style={{ fontFamily: "var(--font-sans)" }}
        >
          ELSIAA
        </span>
      </div>
      <style>{`
        @keyframes dhpShimmer { 0%, 100% { opacity: .55 } 50% { opacity: 1 } }
        .dhp-shimmer { animation: dhpShimmer 2.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .dhp-shimmer { animation: none } }
      `}</style>
    </div>
  );
}

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
      <div className="mx-auto mt-20 hidden max-w-5xl lg:block">
        <div className="mx-auto mb-14 max-w-3xl border-t border-black/[0.08] pt-8 md:pt-12 text-center">
          <h3
            className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[#111111] text-balance md:text-5xl"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            We specialize in <span className="text-[#1e6b3c]">healthcare</span>.
          </h3>
          <p
            className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#111111]/55 md:text-lg"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            We uplift and re-vision entire healthcare brands — staffing firms, clinics,
            telehealth, and ABA providers — making your brand more professional and
            better received by the patients, families, and partners who judge it first.
          </p>
        </div>
        <div
          ref={boxRef}
          className="relative mt-6 aspect-[16/9] overflow-hidden rounded-2xl border border-black/10 shadow-[0_50px_110px_-50px_rgba(17,17,17,0.5)]"
        >
          <div className="absolute inset-0">
            <SitePreview src="https://dialoghealthcare.com" poster="/assets/compare/mrbins_old.jpg" title="Dialog Healthcare — current website" />
          </div>
          <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}>
            <DialogNewPreview />
          </div>
          <div
            className="absolute top-0 bottom-0 z-10 w-11 -translate-x-1/2 cursor-ew-resize touch-none"
            style={{ left: `${pct}%` }}
            onPointerDown={(e) => {
              dragging.current = true;
              (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
              move(e.clientX);
            }}
            onPointerMove={(e) => dragging.current && move(e.clientX)}
            onPointerUp={() => (dragging.current = false)}
          >
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_12px_rgba(0,0,0,0.5)]" />
            <div className="absolute top-1/2 left-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-[0_10px_28px_-6px_rgba(17,17,17,0.5)]">
              <span className="text-[13px] font-bold text-[#111111]">⇔</span>
            </div>
          </div>
          <span
            className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-full bg-[#1e6b3c] px-3 py-1 text-[13px] font-bold text-white "
            style={{ fontFamily: "var(--font-sans)" }}
          >
            ELSIAA — in production
          </span>
          <span
            className="pointer-events-none absolute right-3 bottom-3 z-10 rounded-full bg-black/55 px-3 py-1 text-[13px] font-bold text-white/85  backdrop-blur"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Their site today
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
  return null;
}

function Ticker() {
  const WORDS = [
    "Websites", "Apps", "Brand Identity", "Motion", "AI Automation", "Product Ads",
    "UI/UX", "Packaging", "Interactive",
  ];
  const row = WORDS.map((w, i) => (
    <span key={i} className="flex items-center gap-8">
      <span
        className="text-[13px] whitespace-nowrap text-[#111111]/55 "
        style={{ fontFamily: "var(--font-sans)" }}
      >
        {w}
      </span>
      <span className="h-1 w-1 rounded-full bg-[#1e6b3c]" />
    </span>
  ));
  return (
    <div className="overflow-hidden border-y border-black/[0.07] bg-[#F5F5F3] py-4">
      <div className="tk-track flex w-max items-center gap-8">
        {row}
        {row}
      </div>
      <style>{`
        @keyframes tkScroll { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        .tk-track { animation: tkScroll 28s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .tk-track { animation: none } }
      `}</style>
    </div>
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
            className={`rounded-full px-5 py-2 text-[13px] font-bold  transition-all ${
              side === k ? (k === "after" ? "bg-[#1e6b3c] text-white" : "bg-[#111111] text-white") : "text-black/55"
            }`}
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {k === "after" ? "After — ELSIAA" : "Before"}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- site preview — real desktop site, scrollable inside the window ----------------
   The page renders at a true 1280px viewport and is scaled to fit the frame, so
   layout is always the desktop layout. A pre-rendered screenshot holds the exact
   same frame until the iframe is ready, so there is never a blank or a jump.
   Phones gate the load behind a tap (the poster is shown meanwhile). */
function SitePreview({ src, poster, title }: { src: string; poster: string; title: string }) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0);
  const [h, setH] = useState(0);
  const [load, setLoad] = useState(false);
  const [ready, setReady] = useState(false);
  const [gated, setGated] = useState(false);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => { setScale(el.clientWidth / 1280); setH(el.clientHeight); };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (window.matchMedia("(pointer: coarse) and (max-width: 1023px)").matches) {
      setGated(true);
      return () => ro.disconnect();
    }
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && (setLoad(true), io.disconnect())),
      { rootMargin: "500px" },
    );
    io.observe(el);
    return () => { ro.disconnect(); io.disconnect(); };
  }, []);

  return (
    <div ref={boxRef} className="relative h-full w-full overflow-hidden bg-[#f4f4f2]">
      {/* poster — always mounted underneath, hidden once the live page paints */}
      <img
        src={poster}
        alt={title}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-500"
        style={{ opacity: ready ? 0 : 1 }}
      />
      {load && scale > 0 && (
        <iframe
          src={src}
          title={title}
          loading="lazy"
          onLoad={() => setReady(true)}
          className="absolute top-0 left-0 origin-top-left"
          style={{ width: "1280px", maxWidth: "none", minWidth: "1280px", height: `${Math.ceil(h / scale)}px`, transform: `scale(${scale})`, transformOrigin: "top left", border: "0", display: "block" }}
        />
      )}
      {gated && !load && (
        <button
          onClick={() => setLoad(true)}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-white/45 backdrop-blur-[1px]"
          aria-label={`Explore ${title}`}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#111111] text-white shadow-lg">▶</span>
          <span className="rounded-full bg-white/90 px-3 py-1 text-[13px] font-medium text-[#111111]" style={{ fontFamily: "var(--font-sans)" }}>
            Tap to scroll the live site
          </span>
        </button>
      )}
      {!gated && ready && (
        <span
          className="pointer-events-none absolute right-3 bottom-3 rounded-full bg-white/85 px-3 py-1 text-[12px] font-medium text-[#111111]/70 shadow-sm backdrop-blur-sm"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          Scroll inside ↕
        </span>
      )}
    </div>
  );
}

function DiscoverDesigns() {
  const [side, setSide] = useState<"after" | "before">("after");


  return (
    <section id="discover-designs" className="bg-[#F5F5F3] px-6 pt-10 md:pt-14 pb-10 md:pb-16 text-[#111111]">
      <div className="mx-auto max-w-6xl">
        <SideToggle side={side} setSide={setSide} />

        <div className="relative mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
          <div className="pointer-events-none absolute top-[38%] left-1/2 z-20 hidden -translate-x-1/2 items-center justify-center lg:flex">
            <span
              className="flex h-14 w-14 items-center justify-center rounded-full border border-black/10 bg-white text-[13px] font-bold tracking-[0.08em] text-[#111111] shadow-[0_16px_40px_-12px_rgba(17,17,17,0.3)]"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              VS
            </span>
          </div>

          {/* ------- BEFORE ------- */}
          <Reveal delay={0.05} className={`${side === "before" ? "block" : "hidden"} lg:block`}>
            <div className="mb-3 flex items-end justify-between">
              <div>
                <h3
                  className="mt-1 text-2xl font-semibold tracking-[-0.035em] text-[#111111] md:text-3xl"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  The original.
                </h3>
              </div>
              <a
                href="https://primebins.com"
                target="_blank"
                rel="noreferrer"
                className="text-[13px] text-[#111111]/55  underline-offset-4 hover:underline"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Open ↗
              </a>
            </div>
            <figure className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_40px_90px_-50px_rgba(17,17,17,0.4)]">
              <div className="flex items-center gap-2 border-b border-black/10 bg-[#F0F0EE] px-4 py-2.5">
                <span className="h-2 w-2 rounded-full bg-[#E5695E]" />
                <span className="h-2 w-2 rounded-full bg-[#E0A63F]" />
                <span className="h-2 w-2 rounded-full bg-[#57A85C]" />
                <span
                  className="mx-auto rounded-md bg-white px-4 py-0.5 text-[13px] tracking-[0.08em] text-black/55"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  primebins.com
                </span>
                <span className="h-2 w-6" />
              </div>
              <div className="h-[340px] overflow-hidden md:h-[54svh]">
                {/* Frames primebins.com live, not a mirror. The old local copy
                    under /public/prime-bins/ rendered with no CSS at all — a
                    bare bullet list — which misrepresented the client's actual
                    site in a public before/after. */}
                <SitePreview src="https://primebins.com/" poster="/assets/compare/mrbins_old.jpg" title="Prime Bins — the current website" />
              </div>
            </figure>
            <ul className="mx-auto mt-4 max-w-md space-y-1.5">
              {[
                "Message competes with itself on the first screen",
                "No single path from interest to action",
                "Busy visuals working against the sale",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-[14px] leading-relaxed text-[#111111]/55" style={{ fontFamily: "var(--font-sans)" }}>
                  <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-black/20 text-[13px] font-bold text-white">✕</span>
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>

          {/* ------- AFTER ------- */}
          <Reveal delay={0.15} className={`${side === "after" ? "block" : "hidden"} lg:block`}>
            <div className="mb-3 flex items-end justify-between">
              <div>
                <h3
                  className="mt-1 text-2xl font-semibold tracking-[-0.035em] text-[#111111] md:text-3xl"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  Rebuilt by <span className="text-[#1e6b3c]">ELSIAA</span>.
                </h3>
              </div>
              <a
                href="/mr-bins/"
                target="_blank"
                rel="noreferrer"
                className="text-[13px] text-[#1e6b3c]  underline-offset-4 hover:underline"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Open ↗
              </a>
            </div>
            <figure className="overflow-hidden rounded-2xl border-2 border-[#1e6b3c] bg-white shadow-[0_60px_130px_-45px_rgba(30,107,60,0.5)] ring-4 ring-[#1e6b3c]/10">
              <div className="flex items-center gap-2 border-b border-black/10 bg-[#F0F0EE] px-4 py-2.5">
                <span className="h-2 w-2 rounded-full bg-[#E5695E]" />
                <span className="h-2 w-2 rounded-full bg-[#E0A63F]" />
                <span className="h-2 w-2 rounded-full bg-[#57A85C]" />
                <span
                  className="mx-auto rounded-md bg-white px-4 py-0.5 text-[13px] tracking-[0.08em] text-black/55"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  mr. bins — by ELSIAA
                </span>
                <span className="h-2 w-6" />
              </div>
              <div className="h-[340px] overflow-hidden md:h-[54svh]">
                <SitePreview src="/mr-bins/" poster="/assets/compare/mrbins_new.jpg" title="Mr. Bins — rebuilt by ELSIAA" />
              </div>
            </figure>
            <ul className="mx-auto mt-4 max-w-md space-y-1.5">
              {[
                "The offer is understood in three seconds",
                "Every scroll ends at the next obvious step",
                "Premium restraint — design that earns trust",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-[14px] leading-relaxed text-[#111111]/70" style={{ fontFamily: "var(--font-sans)" }}>
                  <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-[#1e6b3c] text-[13px] font-bold text-white">✓</span>
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

function AfterApp({
  tab,
  setTab,
  done,
  toggle,
}: {
  tab: number;
  setTab: (i: number) => void;
  done: boolean[];
  toggle: (i: number) => void;
}) {
  const streak = 12 + (done[1] ? 1 : 0) + (done[2] ? 1 : 0);
  const doneCount = done.filter(Boolean).length;
  const MITZVOT = ["Morning tefillah", "Give tzedakah", "Call your mother"];
  return (
    <div className="flex h-full flex-col bg-[#FBFBFA] pt-9" style={{ fontFamily: "var(--font-sans)" }}>
      <div className="flex items-center justify-between px-4 pb-2">
        <span className="text-[13px] font-bold tracking-tight text-[#111111]">
          Mitzva<span className="text-[#1e6b3c]">.</span>
        </span>
        <span className="rounded-full bg-[#1e6b3c] px-2.5 py-1 text-[13px] font-bold tracking-[0.12em] text-white ">
          🔥 {streak}-day streak
        </span>
      </div>
      <div className="flex-1 overflow-hidden px-4">
        {tab === 0 && (
          <div className="space-y-2">
            <p className="text-[16px] leading-tight font-semibold tracking-[-0.02em] text-[#111111]">
              Today&rsquo;s three.
              <br />
              One tap each.
            </p>
            {MITZVOT.map((m, i) => (
              <button
                key={m}
                onClick={() => toggle(i)}
                className={`flex w-full items-center justify-between rounded-xl p-2.5 text-left shadow-sm transition-all duration-300 active:scale-[0.98] ${
                  done[i] ? "bg-[#1e6b3c] text-white" : "bg-white text-[#111111]"
                }`}
              >
                <span className="text-[13px] font-semibold">{m}</span>
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[13px] font-bold ${
                    done[i] ? "bg-white text-[#1e6b3c]" : "border border-black/15 text-transparent"
                  }`}
                >
                  ✓
                </span>
              </button>
            ))}
            <div className="flex items-center justify-center gap-3 pt-1.5">
              <svg viewBox="0 0 44 44" className="h-14 w-14 -rotate-90">
                <circle cx="22" cy="22" r="18" fill="none" stroke="#e8e8e6" strokeWidth="4.5" />
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  fill="none"
                  stroke="#1e6b3c"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeDasharray={`${(doneCount / 3) * 113} 113`}
                  className="transition-all duration-500"
                />
              </svg>
              <div>
                <p className="text-[13px] font-semibold text-[#111111]">{doneCount} of 3</p>
                <p className="text-[13px] text-black/55">
                  {doneCount === 3 ? "Day complete — streak grows" : "Finish the day, feed the streak"}
                </p>
              </div>
            </div>
          </div>
        )}
        {tab === 1 && (
          <div className="space-y-2.5">
            <p className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111]">Your week</p>
            <div className="flex items-end gap-1.5">
              {[3, 2, 3, 1, 3, 3, doneCount].map((v, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t-sm transition-all duration-500 ${v === 3 ? "bg-[#1e6b3c]" : "bg-[#1e6b3c]/30"}`}
                    style={{ height: 14 + v * 12 }}
                  />
                  <span className="text-[13px] tracking-wide text-black/55 ">
                    {["S", "M", "T", "W", "T", "F", "S"][i]}
                  </span>
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-white p-3 shadow-sm">
              <p className="text-[13px] font-semibold text-[#111111]">{15 + doneCount} of 21 this week</p>
              <p className="mt-0.5 text-[13px] text-black/55">Best week this month</p>
            </div>
          </div>
        )}
        {tab === 2 && (
          <div className="space-y-2.5">
            <p className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111]">Community</p>
            <div className="rounded-xl bg-[#111111] p-3.5 text-white">
              <p className="text-[13px]  opacity-60">Family circle</p>
              <p className="mt-2 text-[13px] font-semibold">{245 + doneCount} mitzvot together</p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-[#2e9e58] transition-all duration-500"
                  style={{ width: `${80 + doneCount * 2}%` }}
                />
              </div>
            </div>
            <div className="rounded-xl bg-white p-3 shadow-sm">
              <p className="text-[13px] font-semibold text-[#111111]">Abba is 2 ahead of you</p>
              <p className="mt-0.5 text-[13px] text-black/55">Friendly competition, eternal rewards</p>
            </div>
          </div>
        )}
      </div>
      <div className="flex border-t border-black/[0.06] bg-white">
        {["Today", "Week", "Circle"].map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`flex-1 py-3 text-[13px] font-semibold tracking-[0.12em]  transition-colors ${
              tab === i ? "text-[#1e6b3c]" : "text-black/50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

function BeforeApp({ tab, setTab }: { tab: number; setTab: (i: number) => void }) {
  return (
    <div className="flex h-full flex-col bg-[#e8e4d8] pt-9" style={{ fontFamily: "var(--font-sans)" }}>
      <div className="bg-[#3d3a33] px-3 py-2">
        <p className="text-[13px] font-bold tracking-wide text-[#c9a227]">PSI CONSTRUCTION APP</p>
        <p className="text-[13px] text-white/50">v1.0.2 — update required</p>
      </div>
      <div className="bg-[#c9a227] px-3 py-1.5">
        <p className="text-[13px] font-bold text-[#3d3a33]">⚠️ CALL NOW FOR FREE ESTIMATE!!! ⚠️</p>
      </div>
      <div className="flex-1 overflow-hidden px-3 pt-2">
        {tab === 0 && (
          <div className="space-y-1.5">
            {["Home", "About Us", "Our Services", "Photo Gallery", "Request Estimate", "Insurance Info", "Testimonials", "Service Areas", "Contact Us", "Terms of Use"].map((m) => (
              <div key={m} className="flex items-center justify-between border-b border-black/10 bg-white px-2.5 py-1.5">
                <span className="text-[13px] text-[#3d3a33]">{m}</span>
                <span className="text-[13px] text-black/50">›</span>
              </div>
            ))}
          </div>
        )}
        {tab === 1 && (
          <div className="space-y-1.5">
            <div className="bg-white p-2">
              <p className="text-[13px] leading-relaxed text-[#444]">
                Photos coming soon. Please check back later. For examples of our work
                please visit our office or call during business hours (Mon-Fri 8-4)...
              </p>
            </div>
            <div className="bg-[#d6d0c0] p-2 text-center">
              <p className="text-[13px] text-black/60">[ image failed to load ]</p>
            </div>
            <div className="bg-[#d6d0c0] p-2 text-center">
              <p className="text-[13px] text-black/60">[ image failed to load ]</p>
            </div>
          </div>
        )}
        {tab === 2 && (
          <div className="bg-white p-2.5">
            <p className="text-[13px] font-bold text-[#3d3a33]">REQUEST AN ESTIMATE</p>
            <p className="mt-1 text-[13px] leading-relaxed text-black/60">
              Please fill out all 14 required fields. Estimates are processed within
              5-7 business days...
            </p>
            <div className="mt-2 h-5 w-full border border-black/20 bg-[#f4f4f4]" />
            <div className="mt-1.5 h-5 w-full border border-black/20 bg-[#f4f4f4]" />
            <div className="mt-1.5 h-5 w-full border border-black/20 bg-[#f4f4f4]" />
          </div>
        )}
      </div>
      <div className="flex border-t border-black/15 bg-[#3d3a33]">
        {["Menu", "Gallery", "Estimate"].map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`flex-1 py-3 text-[13px] font-bold tracking-wide  ${
              tab === i ? "text-[#c9a227]" : "text-white/50"
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
    <a
      href="/quote?service=App"
      className="inline-flex items-center gap-2 rounded-full bg-[#111111] px-6 py-3 text-[14px] font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#1e6b3c]"
      style={{ fontFamily: F }}
    >
      Get an app quoted →
    </a>
  );
}


function DiscoverApps() {
  const [side, setSide] = useState<"after" | "before">("after");
  // controlled app state — shared by the demo engine and the visitor
  const [mTab, setMTab] = useState(0);
  const [mDone, setMDone] = useState([true, false, false]);
  const [pTab, setPTab] = useState(0);
  const mTouched = useRef(false);
  const pTouched = useRef(false);
  const mFingerRef = useRef<HTMLDivElement | null>(null);
  const pFingerRef = useRef<HTMLDivElement | null>(null);
  const mStatusRef = useRef<HTMLSpanElement | null>(null);
  const pStatusRef = useRef<HTMLSpanElement | null>(null);

  const mToggle = (i: number) => setMDone((d) => d.map((v, j) => (j === i ? !v : v)));

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const t0 = performance.now();
    let mFired: Record<string, boolean> = {};
    let pFired: Record<string, boolean> = {};
    let lastMLoop = -1;
    let lastPLoop = -1;

    // scripted walkthroughs — [time, x%, y%, action, status]
    type Step = { t: number; x: number; y: number; act?: () => void; status: string };
    const M_LOOP = 13;
    const mSteps: Step[] = [
      { t: 0.5, x: 50, y: 46, status: "Watching the Mitzva app demo itself…" },
      { t: 2, x: 50, y: 46, act: () => setMDone((d) => [d[0], true, d[2]]), status: "Tzedakah — logged in one tap" },
      { t: 4, x: 50, y: 57, act: () => setMDone((d) => [d[0], d[1], true]), status: "Third mitzvah — the ring closes" },
      { t: 6.5, x: 50, y: 93, act: () => setMTab(1), status: "Week view — 18 of 21, best this month" },
      { t: 9, x: 75, y: 93, act: () => setMTab(2), status: "Family circle — 247 mitzvot together" },
      { t: 11.5, x: 25, y: 93, act: () => { setMTab(0); setMDone([true, false, false]); }, status: "A new day begins" },
    ];
    const P_LOOP = 13;
    const pSteps: Step[] = [
      { t: 0.5, x: 50, y: 40, status: "Watching the legacy app struggle…" },
      { t: 2.5, x: 50, y: 93, act: () => setPTab(1), status: "Gallery — images failed to load" },
      { t: 6, x: 79, y: 93, act: () => setPTab(2), status: "Estimate — 14 required fields, 5-7 days" },
      { t: 9.5, x: 21, y: 93, act: () => setPTab(0), status: "Back to the menu maze" },
    ];

    const run = (
      steps: Step[],
      loopLen: number,
      time: number,
      finger: HTMLDivElement | null,
      status: HTMLSpanElement | null,
      fired: Record<string, boolean>,
      loopCount: number,
      lastLoop: number,
    ): [Record<string, boolean>, number] => {
      if (loopCount !== lastLoop) fired = {};
      const t = time % loopLen;
      let active: Step | null = null;
      for (const st of steps) if (t >= st.t) active = st;
      if (active && finger) {
        finger.style.left = `${active.x}%`;
        finger.style.top = `${active.y}%`;
      }
      if (active && status) status.textContent = active.status;
      for (const st of steps) {
        const key = String(st.t);
        if (t >= st.t && !fired[key]) {
          fired[key] = true;
          if (st.act) st.act();
          if (finger) {
            finger.style.transform = "translate(-50%, -50%) scale(0.72)";
            setTimeout(() => {
              if (finger) finger.style.transform = "translate(-50%, -50%) scale(1)";
            }, 160);
          }
        }
      }
      return [fired, loopCount];
    };

    const tick = () => {
      const time = (performance.now() - t0) / 1000;
      if (!mTouched.current) {
        const loop = Math.floor(time / M_LOOP);
        [mFired, lastMLoop] = run(mSteps, M_LOOP, time, mFingerRef.current, mStatusRef.current, mFired, loop, lastMLoop);
        lastMLoop = loop;
        if (mFingerRef.current) mFingerRef.current.style.opacity = "1";
      } else if (mFingerRef.current) {
        mFingerRef.current.style.opacity = "0";
        if (mStatusRef.current) mStatusRef.current.textContent = "Your hands now — tap anything";
      }
      if (!pTouched.current) {
        const loop = Math.floor(time / P_LOOP);
        [pFired, lastPLoop] = run(pSteps, P_LOOP, time, pFingerRef.current, pStatusRef.current, pFired, loop, lastPLoop);
        lastPLoop = loop;
        if (pFingerRef.current) pFingerRef.current.style.opacity = "1";
      } else if (pFingerRef.current) {
        pFingerRef.current.style.opacity = "0";
        if (pStatusRef.current) pStatusRef.current.textContent = "Your hands now — tap anything";
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const finger = (ref: React.RefObject<HTMLDivElement | null>) => (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute z-20 h-9 w-9 rounded-full border-2 border-white bg-[#111111]/30 opacity-0 shadow-[0_6px_18px_rgba(0,0,0,0.35)] backdrop-blur-[2px]"
      style={{
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%) scale(1)",
        transition: "left 0.7s cubic-bezier(.22,.61,.36,1), top 0.7s cubic-bezier(.22,.61,.36,1), transform 0.16s ease, opacity 0.3s ease",
      }}
    />
  );

  return (
    <section className="bg-[#F5F5F3] px-6 pt-6 pb-9 text-[#111111] md:pb-24">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2
            className="mx-auto mt-4 max-w-3xl text-center text-3xl font-semibold tracking-[-0.035em] text-balance md:text-5xl md:leading-[1.06]"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            It doesn&rsquo;t matter how good your backend is.
          </h2>
          <p
            className="mx-auto mt-3 max-w-2xl text-center text-base text-[#111111]/60 md:text-xl"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            If your target audience doesn&rsquo;t use your app because of poor design,
            the engineering never gets its chance.
          </p>
        </Reveal>
        <SideToggle side={side} setSide={setSide} />

        <div className="relative mt-7 grid grid-cols-1 gap-8 md:mt-9 md:gap-16 lg:grid-cols-2 lg:gap-10">
          <div className="pointer-events-none absolute top-[40%] left-1/2 z-20 hidden -translate-x-1/2 items-center justify-center lg:flex">
            <span
              className="flex h-14 w-14 items-center justify-center rounded-full border border-black/10 bg-white text-[13px] font-bold tracking-[0.08em] text-[#111111] shadow-[0_16px_40px_-12px_rgba(17,17,17,0.3)]"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              VS
            </span>
          </div>

          {/* ---- AFTER: Mitzva ---- */}
          <Reveal delay={0.05} className={`${side === "after" ? "block" : "hidden"} lg:block`}>
            <div className="mb-5 text-center">
              <h3
                className="mt-1 text-2xl font-semibold tracking-[-0.035em] md:text-3xl"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                The Mitzva app — by <span className="text-[#1e6b3c]">ELSIAA</span>.
              </h3>
            </div>
            <div
              className="relative mx-auto w-fit"
              onPointerDown={() => (mTouched.current = true)}
              onPointerLeave={() => (mTouched.current = false)}
            >
              <div
                aria-hidden
                className="absolute top-1/2 left-1/2 -z-10 h-[120%] w-[150%] -translate-x-1/2 -translate-y-1/2"
                style={{ background: "radial-gradient(circle, rgba(46,158,88,0.16) 0%, transparent 62%)" }}
              />
              <div className="relative rounded-[44px] ring-4 ring-[#1e6b3c]/15">
                {finger(mFingerRef)}
                <PhoneShell>
                  <AfterApp tab={mTab} setTab={setMTab} done={mDone} toggle={mToggle} />
                </PhoneShell>
              </div>
            </div>
            <p className="mt-4 text-center">
              <span
                ref={mStatusRef}
                className="text-[13px] text-[#1e6b3c] "
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Watching the Mitzva app demo itself…
              </span>
            </p>
            <ul className="mx-auto mt-5 max-w-xs space-y-2">
              {[
                "The day's purpose is one glance, one tap",
                "Progress you can feel — streaks, weeks, family circles",
                "Design that makes the habit effortless",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-[14px] leading-relaxed text-[#111111]/70" style={{ fontFamily: "var(--font-sans)" }}>
                  <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-[#1e6b3c] text-[13px] font-bold text-white">✓</span>
                  {t}
                </li>
              ))}
            </ul>
            <StoreBadges />
          </Reveal>

          {/* ---- BEFORE: PSI Construction ---- */}
          <Reveal delay={0.15} className={`${side === "before" ? "block" : "hidden"} lg:block`}>
            <div className="mb-5 text-center">
              <h3
                className="mt-1 text-2xl font-semibold tracking-[-0.035em] md:text-3xl"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                The legacy contractor app.
              </h3>
            </div>
            <div
              className="relative mx-auto w-fit"
              onPointerDown={() => (pTouched.current = true)}
              onPointerLeave={() => (pTouched.current = false)}
            >
              <div className="relative">
                {finger(pFingerRef)}
                <PhoneShell>
                  <BeforeApp tab={pTab} setTab={setPTab} />
                </PhoneShell>
              </div>
            </div>
            <p className="mt-4 text-center">
              <span
                ref={pStatusRef}
                className="text-[13px] text-[#111111]/55 "
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Watching the legacy app struggle…
              </span>
            </p>
            <ul className="mx-auto mt-5 max-w-xs space-y-2">
              {[
                "A menu of links where the product should be",
                "The one thing users want is buried in a form",
                "Broken galleries instead of a reason to trust",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-[14px] leading-relaxed text-[#111111]/55" style={{ fontFamily: "var(--font-sans)" }}>
                  <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-black/20 text-[13px] font-bold text-white">✕</span>
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div className="mx-auto mt-12 max-w-5xl border-t border-black/[0.08] pt-10">
            <div className="mt-8 grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Platform-correct", "iOS and Android patterns done natively — gestures, navigation, and type that feel at home on each device."],
                ["Design systems", "Components, tokens, and states documented so your developers build exactly what was designed."],
                ["Micro-interactions", "The taps, springs, and transitions that make an app feel alive — designed, not left to chance."],
                ["Store-ready", "Icons, screenshots, and listing assets for the App Store and Google Play, prepared to spec."],
              ].map(([t, d]) => (
                <div key={t}>
                  <h4
                    className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111]"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    {t}
                  </h4>
                  <p
                    className="mt-2 text-[13px] leading-relaxed text-[#111111]/55"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    {d}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- live logo marquee ---------------- */
const MARQUEE_LOGOS: Array<[string, string, string]> = [
  ["/assets/logos/mr_bins.png", "Mr. Bins", "h-7"],
  ["/assets/logos/dialog_healthcare.png", "Dialog Healthcare", "h-5"],
  ["/assets/logos/first_medcare.png", "First Medcare Inc", "h-8"],
  ["/assets/logos/excelsior.png", "Excelsior Healthcare Solutions", "h-6"],
  ["/assets/logos/hiddenlight.png", "HiddenLight ABA", "h-6"],
  ["/assets/logos/beyond_autism.png", "Beyond Autism Services", "h-10"],
  ["/assets/logos/kore_autism.png", "Kore Autism Services", "h-8"],
  ["/assets/logos/hidden_talents.png", "Hidden Talents ABA", "h-8"],
  ["/assets/logos/diet_fantasy.png", "The Diet Fantasy", "h-8"],
];

function LogoMarquee() {
  return (
    <div className="relative mt-8 w-full overflow-hidden">
      <style>{`@keyframes elsiaa-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-white to-transparent" />
      <div
        className="flex w-max items-center gap-16 pr-16"
        style={{ animation: "elsiaa-marquee 36s linear infinite" }}
      >
        {[...MARQUEE_LOGOS, ...MARQUEE_LOGOS].map(([src, alt, h], i) => (
          <img
            key={`${src}-${i}`}
            src={src}
            alt={alt}
            className={`${h} w-auto flex-none opacity-90 transition-all duration-300 hover:-translate-y-0.5 hover:opacity-100`}
            loading="lazy"
          />
        ))}
      </div>
    </div>
  );
}

/* ---------------- scroll-controlled assembly cinematic ---------------- */
function ScrollScrubVideo() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    const wrap = wrapRef.current;
    const v = videoRef.current;
    if (!wrap || !v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      v.loop = true;
      v.play().catch(() => {});
      return;
    }
    let target = 0;
    let current = 0;
    let raf = 0;
    let ready = false;
    const onMeta = () => {
      ready = true;
    };
    v.addEventListener("loadedmetadata", onMeta);
    if (v.readyState >= 1) ready = true;
    const measure = () => {
      const r = wrap.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      target = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
    };
    const tick = () => {
      measure();
      current += (target - current) * 0.12;
      if (ready && v.duration && Number.isFinite(v.duration)) {
        const t = current * (v.duration - 0.05);
        if (Math.abs(v.currentTime - t) > 0.001) {
          try {
            v.currentTime = t;
          } catch {}
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      v.removeEventListener("loadedmetadata", onMeta);
    };
  }, []);
  return (
    <div ref={wrapRef} className="relative mt-9 h-[260vh]">
      <div className="sticky top-0 flex h-[100svh] flex-col items-center justify-center">
        <div className="w-full overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_60px_130px_-60px_rgba(17,17,17,0.35)]">
          <video
            ref={videoRef}
            src="/assets/design_brand_white_v4.mp4"
            poster="/assets/design_brand_white_poster_v4.jpg"
            muted
            playsInline
            preload="auto"
            className="aspect-video w-full object-cover"
          />
        </div>
        <p
          className="mt-5 max-w-xl text-center text-sm leading-relaxed text-[#111111]/55 md:text-base"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          Scroll — one identity on every object. This is what clean
          branding looks like.
        </p>
        <LogoMarquee />
      </div>
    </div>
  );
}

/* ---------------- product design — the right way ---------------- */
function ProductAdFeature() {
  return (
    <section className="relative overflow-hidden bg-white px-6 pt-28 pb-10 text-[#111111] md:pt-32 md:pb-20">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-7 md:gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          {/* the argument */}
          <Reveal>
            <p className="text-[12px] font-semibold tracking-[0.14em] text-[#1e6b3c] uppercase" style={{ fontFamily: F }}>
              Design
            </p>
            <h1
              className="mt-5 text-[2.3rem] leading-[1.05] font-semibold tracking-[-0.04em] text-balance md:text-[3.6rem]"
              style={{ fontFamily: F }}
            >
              Design is art.
              <br />
              <span className="text-[#1e6b3c]">And art has a job.</span>
            </h1>
            <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-[#111111]/65 md:text-[17px]" style={{ fontFamily: F }}>
              AI did not replace artists — artists use the same tools you do. It is not the
              tools, it is how they are used. That is our job.
            </p>
            <p className="mt-4 max-w-xl border-l-2 border-[#1e6b3c] pl-5 text-[16px] leading-relaxed font-medium text-[#111111]/75 md:text-[17px]" style={{ fontFamily: F }}>
              Pour everything into the backend and generic front-end design will still
              quietly kill it. If the UI is bad, visitors don't become customers.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
              <a
                href="/quote?service=Website"
                className="inline-flex min-h-[52px] items-center rounded-full bg-[#1e6b3c] px-8 text-[15px] font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#111111]"
                style={{ fontFamily: F }}
              >
                Start a project →
              </a>
              <a
                href="#websites"
                className="text-[15px] font-semibold text-[#1e6b3c] transition-colors hover:text-[#111111]"
                style={{ fontFamily: F }}
              >
                See the work ↓
              </a>
            </div>
          </Reveal>

          {/* the mark — the easel carrying the ELSIAA lion on its canvas.
              design_easel_cut.png is the alpha-cut version: the source art is
              opaque white, which would show as a white box on the gradient. */}
          <Reveal delay={0.1}>
            <div className="relative mx-auto w-full max-w-[440px]">
              <div
                className="overflow-hidden rounded-[28px] p-8 md:p-10"
                style={{ background: "linear-gradient(160deg,#eef5f0 0%,#f7faf8 100%)" }}
              >
                <img
                  src="/assets/design_easel_cut.png"
                  alt="An easel holding a canvas painted with the ELSIAA lion, beside a palette and brushes"
                  width={423}
                  height={468}
                  /* inline, not max-w-[…]: styles.css has an unlayered
                     `img,video,canvas,iframe { max-width:100% }`, and unlayered
                     rules beat every Tailwind utility layer, so max-w-* on an
                     image is inert. */
                  style={{ maxWidth: 300 }}
                  className="mx-auto block w-full select-none drop-shadow-[0_14px_30px_rgba(17,17,17,0.10)]"
                />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------------- 2 · we design every aspect — Mr. Bins hero + live sites ---------------- */
const F = "var(--font-sans)";

/*
  Client review under the Mr. Bins before/after.

  Renders a clearly-marked PLACEHOLDER until the real words exist. It is styled
  as an obvious empty slot (dashed border, "placeholder" label) so it can never
  be mistaken for — or accidentally ship as — a real testimonial: a quote
  attributed to a named, identifiable client they did not say is a fabricated
  review, which is what we removed from the homepage earlier.

  To go live: put the client's actual words in `quote` and their name in `name`.
  The placeholder styling disappears automatically.
*/
const BINS_REVIEW = {
  quote: "",
  name: "",
  role: "Mr. Bins",
};

function BinsReview() {
  const live = BINS_REVIEW.quote.trim().length > 0;
  return (
    <Reveal delay={0.08}>
      <figure
        className={`mx-auto mt-6 max-w-2xl rounded-2xl p-5 md:mt-8 md:p-7 ${
          live
            ? "border border-black/[0.08] bg-[#FBFBFA]"
            : "border-2 border-dashed border-[#111111]/15 bg-[#FBFBFA]/60"
        }`}
      >
        {!live && (
          <p
            className="mb-3 text-[11px] font-bold tracking-[0.14em] text-[#b4543a] uppercase"
            style={{ fontFamily: F }}
          >
            Placeholder — awaiting the client's own words
          </p>
        )}
        <div className={`flex gap-0.5 ${live ? "" : "opacity-70"}`} aria-hidden>
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className="text-[17px] leading-none text-[#FBBC05]">★</span>
          ))}
        </div>
        <blockquote
          className={`mt-3 text-[15px] leading-relaxed md:text-[17px] ${
            live ? "text-[#111111]/80" : "text-[#111111]/35 italic"
          }`}
          style={{ fontFamily: F }}
        >
          {live
            ? `\u201C${BINS_REVIEW.quote}\u201D`
            : "The review from Mr. Bins goes here, in their words. Two or three sentences on what changed after the rebuild."}
        </blockquote>
        <figcaption
          className={`mt-3 text-[13px] ${live ? "text-[#111111]/55" : "text-[#111111]/35"}`}
          style={{ fontFamily: F }}
        >
          {live && BINS_REVIEW.name ? `${BINS_REVIEW.name} — ` : ""}
          {BINS_REVIEW.role}
        </figcaption>
      </figure>
    </Reveal>
  );
}

function BinsCompare() {
  const PANELS = [
    {
      label: "Before",
      tone: "bg-black/60",
      src: "https://primebins.com/",
      poster: "/assets/compare/mrbins_old.jpg",
      title: "Mr. Bins — the current website",
      note: "Everything competes for attention, so nothing lands. No clear next step, hard to read on a phone, and nothing that tells you why to drive there.",
    },
    {
      label: "After — ELSIAA",
      tone: "bg-[#1e6b3c]",
      src: "/mr-bins/",
      poster: "/assets/compare/mrbins_new.jpg",
      title: "Mr. Bins — rebuilt by ELSIAA",
      note: "One clear message up top, real photography of the store, and a single obvious action. Fast, built for phones, and written to get people through the door.",
    },
  ];
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-7">
      {PANELS.map((v) => (
        <div key={v.label}>
          <figure className="group relative overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-[0_28px_70px_-45px_rgba(17,17,17,0.4)] transition-all duration-300 hover:-translate-y-1 hover:border-[#1e6b3c]/30">
            <div className="aspect-[16/11] overflow-hidden">
              <SitePreview src={v.src} poster={v.poster} title={v.title} />
            </div>
            <figcaption
              className={`absolute top-3 left-3 z-10 rounded-full px-3 py-1 text-[12px] font-semibold text-white ${v.tone}`}
              style={{ fontFamily: F }}
            >
              {v.label}
            </figcaption>
          </figure>
          <p className="mt-3 text-[14px] leading-relaxed text-[#111111]/60" style={{ fontFamily: F }}>
            {v.note}
          </p>
        </div>
      ))}
    </div>
  );
}

const LIVE_SITES: Array<{ name: string; kind: string; url?: string }> = [
  { name: "Michael Elbaz Law", kind: "Legal practice" },
  { name: "PSI Construction", kind: "Construction", url: "https://www.psiconstructionpa.com" },
  { name: "Dialog Healthcare", kind: "Healthcare", url: "https://dialoghealthcare.com" },
];

function DesignEverything() {
  const sitesRef = useRef<HTMLDivElement>(null);
  const nudge = (dir: 1 | -1) => {
    const el = sitesRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.85, 340), behavior: "smooth" });
  };
  return (
    <section className="bg-white px-6 py-10 md:py-16" id="websites">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2 className="max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-[#111111] md:text-5xl" style={{ fontFamily: F }}>
            We obsess over every aspect of your online presence.
          </h2>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[#111111]/60 md:text-[16px]" style={{ fontFamily: F }}>
            The same business, before and after an ELSIAA rebuild.
          </p>
        </Reveal>

        <Reveal delay={0.06}>
          <div className="mt-8">
            <BinsCompare />
            <p className="mt-3 text-[13.5px] text-[#111111]/50" style={{ fontFamily: F }}>
              Both are live — scroll inside either one.
            </p>
          </div>
        </Reveal>

        <BinsReview />

        {/* the point of it all */}
        <Reveal delay={0.05}>
          <p
            className="mx-auto mt-9 max-w-3xl border-l-2 border-[#1e6b3c] pl-5 text-[16px] leading-relaxed font-medium text-[#111111]/75 md:mt-14 md:text-[20px]"
            style={{ fontFamily: F }}
          >
            We don't just design your site. Our goal is to convert strangers who view it
            into clients — and we take that responsibility seriously.
          </p>
        </Reveal>

        {/* live client sites */}
        <div className="relative">
        <div
          ref={sitesRef}
          tabIndex={0}
          role="group"
          aria-label="Live client sites — swipe or use the arrow keys"
          className="-mx-6 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e6b3c] [&::-webkit-scrollbar]:hidden md:mx-0 md:mt-14 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0"
        >
          {LIVE_SITES.map((site, i) => (
            <Reveal key={site.name} className="w-[80vw] max-w-[320px] shrink-0 snap-center md:w-auto md:max-w-none md:shrink" delay={0.05 + i * 0.05}>
              <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-black/[0.08] bg-white transition-all duration-300 hover:-translate-y-1 hover:border-[#1e6b3c]/30 hover:shadow-[0_30px_70px_-45px_rgba(17,17,17,0.35)]">
                <div className="relative aspect-[4/3] overflow-hidden bg-[#F5F5F3]">
                  {site.url ? (
                    <SitePreview src={site.url} poster="/assets/compare/mrbins_new.jpg" title={`${site.name} — live site`} />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#F5F5F3] to-white">
                      <span className="text-[17px] font-semibold tracking-[-0.02em] text-[#111111]/70" style={{ fontFamily: F }}>
                        {site.name}
                      </span>
                      <span className="rounded-full border border-black/10 px-3 py-1 text-[11.5px] font-medium text-[#111111]/45" style={{ fontFamily: F }}>
                        Launching soon
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-baseline justify-between gap-3 px-5 py-4">
                  <div>
                    <h3 className="text-[15.5px] font-semibold tracking-[-0.015em] text-[#111111]" style={{ fontFamily: F }}>
                      {site.name}
                    </h3>
                    <p className="mt-0.5 text-[13px] text-[#111111]/45" style={{ fontFamily: F }}>{site.kind}</p>
                  </div>
                  {site.url && (
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 text-[13px] font-semibold text-[#1e6b3c] transition-colors hover:text-[#111111]"
                      style={{ fontFamily: F }}
                    >
                      Visit ↗
                    </a>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* arrows — the row is horizontally scrollable and that isn't obvious
            without an affordance, so both edges carry a control on every size */}
        <button
          type="button"
          aria-label="Previous site"
          onClick={() => nudge(-1)}
          className="absolute top-[38%] -left-1 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-black/10 bg-white/95 text-[17px] text-[#111111]/60 shadow-[0_10px_30px_-12px_rgba(17,17,17,0.4)] backdrop-blur transition-all hover:border-[#1e6b3c]/40 hover:text-[#1e6b3c] md:-left-4"
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Next site"
          onClick={() => nudge(1)}
          className="absolute top-[38%] -right-1 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-black/10 bg-white/95 text-[17px] text-[#111111]/60 shadow-[0_10px_30px_-12px_rgba(17,17,17,0.4)] backdrop-blur transition-all hover:border-[#1e6b3c]/40 hover:text-[#1e6b3c] md:-right-4"
        >
          ›
        </button>
        </div>
        <p className="mt-3 text-center text-[12.5px] text-[#111111]/45 md:hidden" style={{ fontFamily: F }}>
          Swipe to see more client sites
        </p>
      </div>
    </section>
  );
}

/* ---------------- 3 · buy a website ---------------- */
function BuyWebsite() {
  return (
    <section className="border-y border-black/[0.06] bg-[#F5F5F3] px-6 py-9 md:py-16">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="grid items-center gap-8 md:grid-cols-[1.1fr_0.9fr] md:gap-14">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.035em] text-[#111111] md:text-4xl" style={{ fontFamily: F }}>
                Purchase a website
              </h2>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[#111111]/60 md:text-[16px]" style={{ fontFamily: F }}>
                A clean, fast marketing site — up to five pages, your branding, mobile-perfect,
                contact form, and live hosting. No custom backend, no dashboards, no logins:
                the site that makes people call you.
              </p>
              <p className="mt-3 text-[13.5px] text-[#111111]/45" style={{ fontFamily: F }}>
                Need accounts, portals, or a database? That is backend software — priced separately.
              </p>
            </div>
            <div className="rounded-3xl border border-black/[0.08] bg-white p-7 shadow-[0_24px_60px_-50px_rgba(17,17,17,0.4)] md:p-8">
              <p className="text-[12px] font-semibold tracking-[0.1em] text-[#111111]/40 uppercase" style={{ fontFamily: F }}>
                Starting at
              </p>
              <p className="mt-1 text-[42px] font-semibold leading-none tracking-[-0.04em] text-[#111111]" style={{ fontFamily: F }}>
                $750
              </p>
              <a
                href="/quote?service=Website"
                className="mt-6 flex w-full items-center justify-center rounded-full bg-[#111111] px-6 py-4 text-[15px] font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#1e6b3c]"
                style={{ fontFamily: F }}
              >
                Purchase a website →
              </a>
            </div>
          </div>
        </Reveal>
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
  const railRef = useRef<HTMLDivElement | null>(null);
  const paused = useRef(false);

  const APPS = [
    ["Conversion-Focused Web Experiences", "Sites engineered around a single measurable outcome."],
    ["Native Mobile Application Design", "iOS and Android interfaces that feel born on the device."],
    ["Brand Identity Architecture", "Logo, system, and voice built as one coherent structure."],
    ["Healthcare Brand Revitalization", "Clinical trust, rebuilt for patients and partners."],
    ["Motion Identity Systems", "How your brand moves — defined, not improvised."],
    ["Commercial Product Staging", "Amateur photos rebuilt as studio-grade campaigns."],
    ["Packaging & Unboxing Design", "The two seconds on the shelf, won deliberately."],
    ["Exploded-View Product Films", "Engineering told as cinema, layer by layer."],
    ["Interactive Scroll Narratives", "Stories driven by the visitor's own hand."],
    ["Design System Engineering", "Tokens, components, and rules your developers ship from."],
    ["Data Visualization & Dashboards", "Dense information made instantly legible."],
    ["Presentation & Pitch Architecture", "Decks structured to win the room, slide by slide."],
    ["Editorial & Print Systems", "Ink, stock, and grid — mastered press-ready."],
    ["Environmental & Signage Design", "Readable at a glance, at a distance, in place."],
    ["Campaign Creative at Scale", "Variant systems built for relentless testing."],
    ["Email & Lifecycle Design", "Sequences that render everywhere and convert quietly."],
    ["Social Content Systems", "A feed that looks run by a design team — because it is."],
    ["Iconography & Custom Assets", "Every glyph drawn on one grid, one personality."],
    ["Illustration Direction", "A visual voice no stock library can imitate."],
    ["3D Rendering & Spatial Design", "Products and spaces from angles cameras can't reach."],
    ["AR & Immersive Interfaces", "Design for the surfaces arriving next."],
    ["Conversational & AI Interfaces", "Chat, voice, and agent experiences people trust."],
    ["Accessibility-First Design", "WCAG-compliant by construction, not retrofit."],
    ["Localization & Market Adaptation", "One design, fluent in every market you enter."],
    ["AI Studio Photography", "Custom imagery without photographers, models, or sets."],
    ["Image Restoration & Enhancement", "Archives and assets, returned to full strength."],
    ["Brand Guidelines & Governance", "The rulebook that keeps every region on-brand."],
    ["Trade Show & Event Environments", "A complete visual world for launches and floors."],
    ["App Store & Marketplace Assets", "Listings prepared to spec, designed to convert."],
    ["Developer Documentation Design", "Docs and portals engineers actually enjoy."],
    ["Wayfinding Systems", "Movement through space, designed like a product."],
    ["Investor & Board Materials", "The numbers, carried by narrative and restraint."],
  ];

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let pos = rail.scrollLeft;
    const onManual = () => {
      // resync after arrow clicks / drags so auto-drift continues from there
      pos = rail.scrollLeft;
    };
    rail.addEventListener("scroll", () => {
      if (Math.abs(rail.scrollLeft - pos) > 2) onManual();
    });
    const tick = () => {
      if (!paused.current) {
        pos += 0.8;
        const half = rail.scrollWidth / 2;
        if (pos >= half) pos -= half;
        rail.scrollLeft = pos;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const nudge = (dir: number) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  return (
    <section className="bg-gradient-to-b from-[#F5F5F3] to-white pt-24 pb-9 md:pb-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="mt-3 flex items-end justify-between gap-6">
            <h2
              className="max-w-2xl text-3xl font-semibold tracking-[-0.035em] text-[#111111] md:text-5xl"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Every surface your brand touches.
            </h2>
            <div className="hidden flex-none gap-2 md:flex">
              <button
                aria-label="Scroll left"
                onClick={() => nudge(-1)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-black/15 text-[#111111] transition-all duration-300 hover:border-[#1e6b3c] hover:bg-[#1e6b3c] hover:text-white"
              >
                ←
              </button>
              <button
                aria-label="Scroll right"
                onClick={() => nudge(1)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-black/15 text-[#111111] transition-all duration-300 hover:border-[#1e6b3c] hover:bg-[#1e6b3c] hover:text-white"
              >
                →
              </button>
            </div>
          </div>
          <p className="mt-3 max-w-xl text-base text-[#111111]/60" style={{ fontFamily: "var(--font-sans)" }}>
            Thirty-two applications of design, one standard. It never stops moving —
            neither do we.
          </p>
        </Reveal>
      </div>

      <div
        ref={railRef}
        onPointerEnter={() => (paused.current = true)}
        onPointerLeave={() => (paused.current = false)}
        onTouchStart={() => (paused.current = true)}
        onTouchEnd={() => (paused.current = false)}
        tabIndex={0}
        role="group"
        aria-label="Scrollable list — use the left and right arrow keys"
        onKeyDown={(e) => {
          const el = e.currentTarget;
          if (e.key === "ArrowRight") { e.preventDefault(); el.scrollBy({ left: Math.min(el.clientWidth * 0.8, 420), behavior: "smooth" }); }
          if (e.key === "ArrowLeft") { e.preventDefault(); el.scrollBy({ left: -Math.min(el.clientWidth * 0.8, 420), behavior: "smooth" }); }
        }}
        className="mt-9 flex gap-3 overflow-x-auto px-6 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e6b3c]"
      >
        {[...APPS, ...APPS].map(([t, d], i) => (
          <div
            key={`${t}-${i}`}
            className="group flex w-[280px] flex-none flex-col rounded-2xl border border-black/[0.06] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#1e6b3c]/30 hover:shadow-[0_24px_60px_-30px_rgba(30,107,60,0.35)]"
          >
            <span
              className="text-[13px] text-[#1e6b3c]"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {String((i % APPS.length) + 1)}
            </span>
            <h3
              className="mt-3 text-[17px] leading-snug font-semibold tracking-[-0.02em] text-[#111111]"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {t}
            </h3>
            <p
              className="mt-2 text-[13px] leading-relaxed text-[#111111]/60"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {d}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* Cute cartoon icons for the process steps — same friendly outline style as
   the toy robot: black lines, brand greens, warm neutrals, white fills. */
function StepArt({ step }: { step: number }) {
  const OUT = "#111111";
  const G = "#1e6b3c";
  const GL = "#2e9e58";
  const common = { width: 56, height: 56, viewBox: "0 0 56 56", fill: "none" } as const;
  if (step === 1) {
    // immersion — magnifying glass over a little chart
    return (
      <svg {...common} aria-hidden>
        <rect x="8" y="14" width="26" height="20" rx="3" stroke={OUT} strokeWidth="2" fill="#fff" />
        <path d="M13 28l5-5 4 3 6-7" stroke={GL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="36" cy="34" r="9" stroke={OUT} strokeWidth="2.2" fill="rgba(46,158,88,0.08)" />
        <line x1="43" y1="41" x2="49" y2="47" stroke={OUT} strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }
  if (step === 2) {
    // sketch-first — pencil drawing a squiggle
    return (
      <svg {...common} aria-hidden>
        <path d="M8 44c6-2 10-1 16-6" stroke={OUT} strokeWidth="2" strokeLinecap="round" strokeDasharray="3 4" />
        <g transform="rotate(45 36 22)">
          <rect x="32" y="8" width="8" height="22" rx="1.5" stroke={OUT} strokeWidth="2" fill="#f0d9a8" />
          <rect x="32" y="8" width="8" height="5" rx="1.5" stroke={OUT} strokeWidth="2" fill={GL} />
          <path d="M32 30l4 8 4-8z" stroke={OUT} strokeWidth="2" strokeLinejoin="round" fill="#fff" />
        </g>
      </svg>
    );
  }
  if (step === 3) {
    // directed generation — magic wand with sparkles
    return (
      <svg {...common} aria-hidden>
        <rect x="10" y="34" width="26" height="6" rx="3" transform="rotate(-35 23 37)" stroke={OUT} strokeWidth="2" fill="#d0d5d2" />
        <path d="M40 14l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6 1.6-4z" fill={GL} stroke={OUT} strokeWidth="1.6" strokeLinejoin="round" />
        <circle cx="30" cy="12" r="1.8" fill={G} />
        <circle cx="48" cy="30" r="1.8" fill={G} />
      </svg>
    );
  }
  if (step === 4) {
    // live assembly — little browser window being stacked with blocks
    return (
      <svg {...common} aria-hidden>
        <rect x="9" y="12" width="38" height="30" rx="4" stroke={OUT} strokeWidth="2" fill="#fff" />
        <line x1="9" y1="20" x2="47" y2="20" stroke={OUT} strokeWidth="2" />
        <circle cx="14" cy="16" r="1.4" fill={GL} />
        <circle cx="19" cy="16" r="1.4" fill="#d0d5d2" />
        <rect x="14" y="25" width="12" height="5" rx="1" fill={GL} stroke={OUT} strokeWidth="1.4" />
        <rect x="14" y="32" width="12" height="5" rx="1" fill="#d0d5d2" stroke={OUT} strokeWidth="1.4" />
        <rect x="30" y="25" width="12" height="12" rx="1" fill="rgba(46,158,88,0.15)" stroke={OUT} strokeWidth="1.4" />
      </svg>
    );
  }
  if (step === 5) {
    // ruthless iteration — circular arrows around a gem
    return (
      <svg {...common} aria-hidden>
        <path d="M28 10a18 18 0 0114.5 7.4" stroke={OUT} strokeWidth="2.2" strokeLinecap="round" />
        <path d="M45 12v7h-7" stroke={OUT} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M28 46a18 18 0 01-14.5-7.4" stroke={OUT} strokeWidth="2.2" strokeLinecap="round" />
        <path d="M11 44v-7h7" stroke={OUT} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M28 20l6 6-6 10-6-10 6-6z" fill={GL} stroke={OUT} strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    );
  }
  // launch & refinement — cute rocket
  return (
    <svg {...common} aria-hidden>
      <path d="M28 8c6 4 8 12 8 18l-8 8-8-8c0-6 2-14 8-18z" fill="#fff" stroke={OUT} strokeWidth="2" strokeLinejoin="round" />
      <circle cx="28" cy="20" r="3.4" fill="rgba(46,158,88,0.2)" stroke={OUT} strokeWidth="1.6" />
      <path d="M20 30l-5 7 7-2M36 30l5 7-7-2" fill={GL} stroke={OUT} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M28 36v8" stroke={GL} strokeWidth="2.4" strokeLinecap="round" strokeDasharray="2 3" />
    </svg>
  );
}

/* ---------------- the process — how every uplift actually happens ---------------- */
function OurProcess() {
  const STEPS = [
    ["1", "Immersion", "We study your market and customers first. Research, not aesthetics."],
    ["2", "Sketch first", "Drawn by hand before a pixel exists. No templates, ever."],
    ["3", "Directed generation", "Our AI pipeline turns direction into studio-grade imagery, film, and interfaces."],
    ["4", "Live assembly", "Built as working software from day one. We show you the thing, not a mockup."],
    ["5", "Ruthless iteration", "Anything below the bar gets rebuilt — in hours, not sprints."],
    ["6", "Launch & refine", "It ships live, then keeps improving against real visitor behaviour."],
  ];
  return (
    <section className="bg-[#F5F5F3] px-6 py-10 text-[#111111] md:py-14">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p
            className="text-[13px] text-[#1e6b3c] "
            style={{ fontFamily: "var(--font-sans)" }}
          >
            The ELSIAA process
          </p>
          <h2
            className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.035em] md:text-5xl"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Every uplift runs the same road.
          </h2>
          <p className="mt-3 max-w-xl text-base text-[#111111]/60" style={{ fontFamily: "var(--font-sans)" }}>
            Six stages, one direction — from understanding your business to a living
            product that keeps getting better.
          </p>
        </Reveal>
        {/* one connected run — reads left-to-right, no long scroll */}
        <div className="relative mt-10">
          <div aria-hidden className="absolute top-[27px] right-0 left-0 hidden h-px bg-[#1e6b3c]/20 lg:block" />
          <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-6 lg:gap-x-4">
            {STEPS.map(([n, t, d], i) => (
              <Reveal key={n} delay={Math.min(i * 0.05, 0.25)}>
                <div className="relative">
                  <span className="relative z-10 grid h-[54px] w-[54px] place-items-center rounded-2xl border border-black/[0.08] bg-white shadow-[0_10px_26px_-16px_rgba(17,17,17,0.35)]">
                    <StepArt step={Number(n)} />
                  </span>
                  <p className="mt-4 text-[11.5px] font-bold tracking-[0.14em] text-[#1e6b3c]" style={{ fontFamily: F }}>
                    0{n}
                  </p>
                  <h3 className="mt-1 text-[15.5px] leading-tight font-semibold tracking-[-0.02em] text-[#111111]" style={{ fontFamily: F }}>
                    {t}
                  </h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#111111]/55" style={{ fontFamily: F }}>
                    {d}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
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
 <section className="bg-white px-6 py-10 md:py-14">
      <div className="mx-auto grid max-w-5xl grid-cols-3 gap-8 text-center">
        {[
          { n: 6, s: "", l: "Cities worldwide" },
          { n: 25, s: "+", l: "Design disciplines" },
          { n: 100, s: "%", l: "Fully insured work" },
        ].map((x) => (
          <Reveal key={x.l}>
            <p
              className="text-5xl font-semibold tracking-[-0.035em] text-[#111111] md:text-7xl"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              <Counter to={x.n} suffix={x.s} />
            </p>
            <p
              className="mt-3 text-sm text-[#111111]/55"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {x.l}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------------- 6 · final CTA ---------------- */
function FinalCTA() {
  return (
    <section className="bg-[#070907] px-6 py-10 text-center md:py-14 text-[#F5F5F3]">
      <Reveal>
        <p
          className="text-[13px] text-[#2e9e58] "
          style={{ fontFamily: "var(--font-sans)" }}
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
          href="/contact"
          className="group mt-9 inline-flex items-center gap-3 border border-[#F5F5F3]/25 px-9 py-3.5 text-[13px]  transition-colors duration-300 hover:border-[#2e9e58] hover:text-[#2e9e58]"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          Book a strategy call
          <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
        </a>
        <p
          className="mt-12 text-sm italic text-[#F5F5F3]/40"
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
      {/* narrative: thesis → proof of uplift → breadth → the work → apps →
          trust wall → how we work → numbers → close */}
      <ProductAdFeature />
      <DesignEverything />
      <BuyWebsite />
      <DiscoverApps />
      <BeyondWebsites />
      <LogoMarquee />
      <OurProcess />
      <Results />
      <FinalCTA />
    </>
  );
}

export { FinalCTA as DesignsFinalCTA };
