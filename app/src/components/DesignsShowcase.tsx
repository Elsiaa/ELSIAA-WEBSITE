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
        <span className="text-[11px] tracking-[0.22em] text-[#111111]/55 uppercase" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
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
            className="text-[10px] tracking-[0.3em] text-black/50 uppercase"
            style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
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
    <div className="flex h-full w-full flex-col bg-white" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}>
      <div className="flex items-center justify-between border-b border-black/5 px-8 py-5">
        <span className="text-lg font-bold tracking-tight text-[#111111]">
          Dialog<span className="text-[#111111]/55"> Healthcare</span>
        </span>
        <span className="rounded-full bg-[#1e6b3c] px-5 py-2 text-[10px] font-semibold tracking-[0.18em] text-white uppercase">
          Request staff
        </span>
      </div>
      <div className="flex flex-1 flex-col justify-center px-8">
        <p
          className="text-[10px] tracking-[0.3em] text-[#1e6b3c] uppercase"
          style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
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
          className="text-[10px] tracking-[0.26em] text-black/50 uppercase"
          style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
        >
          New site · in production
        </span>
        <span
          className="rounded-full bg-[#1e6b3c]/10 px-3 py-1 text-[10px] font-bold tracking-[0.22em] text-[#1e6b3c] uppercase"
          style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
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
        <div className="mx-auto mb-14 max-w-3xl border-t border-black/[0.08] pt-12 text-center">
          <h3
            className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[#111111] text-balance md:text-5xl"
            style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
          >
            We specialize in <span className="text-[#1e6b3c]">healthcare</span>.
          </h3>
          <p
            className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#111111]/55 md:text-lg"
            style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
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
            <LazyFrame src="https://dialoghealthcare.com" title="Dialog Healthcare — current website" zoom={0.5} />
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
            className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-full bg-[#1e6b3c] px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-white uppercase"
            style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
          >
            ELSIAA — in production
          </span>
          <span
            className="pointer-events-none absolute right-3 bottom-3 z-10 rounded-full bg-black/55 px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-white/85 uppercase backdrop-blur"
            style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
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
        className="text-[12px] tracking-[0.32em] whitespace-nowrap text-[#111111]/55 uppercase"
        style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
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
            className={`rounded-full px-5 py-2 text-[10px] font-bold tracking-[0.2em] uppercase transition-all ${
              side === k ? (k === "after" ? "bg-[#1e6b3c] text-white" : "bg-[#111111] text-white") : "text-black/55"
            }`}
            style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
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
  const leftFrame = useRef<HTMLIFrameElement | null>(null);
  const rightFrame = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    let cleanup: (() => void) | null = null;
    const iv = window.setInterval(() => {
      const L = leftFrame.current;
      const R = rightFrame.current;
      if (!L || !R) return;
      let lDoc: Document | null = null;
      let rDoc: Document | null = null;
      try {
        lDoc = L.contentDocument;
        rDoc = R.contentDocument;
      } catch {
        return;
      }
      if (!lDoc?.documentElement || !rDoc?.documentElement) return;
      if ((lDoc.readyState !== "complete" && lDoc.readyState !== "interactive") || (rDoc.readyState !== "complete" && rDoc.readyState !== "interactive")) return;
      window.clearInterval(iv);

      let lock: "L" | "R" | null = null;
      let unlockT = 0;
      const range = (d: Document, w: Window) =>
        Math.max(1, d.documentElement.scrollHeight - w.innerHeight);
      const follow = (
        srcW: Window,
        srcD: Document,
        dstW: Window,
        dstD: Document,
        tag: "L" | "R",
      ) => {
        const h = () => {
          const now = performance.now();
          if (lock && lock !== tag && now < unlockT) return;
          lock = tag;
          unlockT = now + 120;
          const p = srcW.scrollY / range(srcD, srcW);
          dstW.scrollTo(0, p * range(dstD, dstW));
        };
        srcW.addEventListener("scroll", h, { passive: true });
        return () => srcW.removeEventListener("scroll", h);
      };
      const lw = L.contentWindow!;
      const rw = R.contentWindow!;
      const offL = follow(lw, lDoc, rw, rDoc, "L");
      const offR = follow(rw, rDoc, lw, lDoc, "R");
      cleanup = () => {
        offL();
        offR();
      };
    }, 600);
    return () => {
      window.clearInterval(iv);
      cleanup?.();
    };
  }, []);

  return (
    <section id="discover-designs" className="bg-[#F5F5F3] px-6 pt-14 pb-16 text-[#111111]">
      <div className="mx-auto max-w-6xl">
        <SideToggle side={side} setSide={setSide} />

        <div className="relative mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
          <div className="pointer-events-none absolute top-[38%] left-1/2 z-20 hidden -translate-x-1/2 items-center justify-center lg:flex">
            <span
              className="flex h-14 w-14 items-center justify-center rounded-full border border-black/10 bg-white text-[13px] font-bold tracking-[0.08em] text-[#111111] shadow-[0_16px_40px_-12px_rgba(17,17,17,0.3)]"
              style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
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
                  style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
                >
                  The original.
                </h3>
              </div>
              <a
                href="https://primebins.com"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] tracking-[0.22em] text-[#111111]/55 uppercase underline-offset-4 hover:underline"
                style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
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
                  className="mx-auto rounded-md bg-white px-4 py-0.5 text-[10px] tracking-[0.08em] text-black/55"
                  style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
                >
                  primebins.com
                </span>
                <span className="h-2 w-6" />
              </div>
              <div className="h-[260px] overflow-hidden md:h-[40svh]">
                <LazyFrame src="/prime-bins/" title="Prime Bins — the original website, live" onFrame={(el) => (leftFrame.current = el)} />
              </div>
            </figure>
            <ul className="mx-auto mt-4 max-w-md space-y-1.5">
              {[
                "Message competes with itself on the first screen",
                "No single path from interest to action",
                "Busy visuals working against the sale",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-[14px] leading-relaxed text-[#111111]/55" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}>
                  <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-black/20 text-[10px] font-bold text-white">✕</span>
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
                  style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
                >
                  Rebuilt by <span className="text-[#1e6b3c]">ELSIAA</span>.
                </h3>
              </div>
              <a
                href="/mr-bins/"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] tracking-[0.22em] text-[#1e6b3c] uppercase underline-offset-4 hover:underline"
                style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
              >
                Open ↗
              </a>
            </div>
            <figure className="overflow-hidden rounded-2xl border-2 border-[#1e6b3c] bg-[#0B2447] shadow-[0_60px_130px_-45px_rgba(30,107,60,0.5)] ring-4 ring-[#1e6b3c]/10">
              <div className="flex items-center gap-2 border-b border-black/10 bg-[#F0F0EE] px-4 py-2.5">
                <span className="h-2 w-2 rounded-full bg-[#E5695E]" />
                <span className="h-2 w-2 rounded-full bg-[#E0A63F]" />
                <span className="h-2 w-2 rounded-full bg-[#57A85C]" />
                <span
                  className="mx-auto rounded-md bg-white px-4 py-0.5 text-[10px] tracking-[0.08em] text-black/55"
                  style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
                >
                  mr. bins — by ELSIAA
                </span>
                <span className="h-2 w-6" />
              </div>
              <div className="h-[260px] overflow-hidden md:h-[40svh]">
                <LazyFrame src="/mr-bins/" title="Mr. Bins — rebuilt by ELSIAA, live" onFrame={(el) => (rightFrame.current = el)} />
              </div>
            </figure>
            <ul className="mx-auto mt-4 max-w-md space-y-1.5">
              {[
                "The offer is understood in three seconds",
                "Every scroll ends at the next obvious step",
                "Premium restraint — design that earns trust",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-[14px] leading-relaxed text-[#111111]/70" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}>
                  <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-[#1e6b3c] text-[10px] font-bold text-white">✓</span>
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
    <div className="flex h-full flex-col bg-[#FBFBFA] pt-9" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}>
      <div className="flex items-center justify-between px-4 pb-2">
        <span className="text-[12px] font-bold tracking-tight text-[#111111]">
          Mitzva<span className="text-[#1e6b3c]">.</span>
        </span>
        <span className="rounded-full bg-[#1e6b3c] px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] text-white uppercase">
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
                <span className="text-[11px] font-semibold">{m}</span>
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
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
                <p className="text-[10px] text-black/55">
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
                  <span className="text-[10px] tracking-wide text-black/55 uppercase">
                    {["S", "M", "T", "W", "T", "F", "S"][i]}
                  </span>
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-white p-3 shadow-sm">
              <p className="text-[10px] font-semibold text-[#111111]">{15 + doneCount} of 21 this week</p>
              <p className="mt-0.5 text-[10px] text-black/55">Best week this month</p>
            </div>
          </div>
        )}
        {tab === 2 && (
          <div className="space-y-2.5">
            <p className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111]">Community</p>
            <div className="rounded-xl bg-[#111111] p-3.5 text-white">
              <p className="text-[10px] tracking-[0.2em] uppercase opacity-60">Family circle</p>
              <p className="mt-2 text-[12px] font-semibold">{245 + doneCount} mitzvot together</p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-[#2e9e58] transition-all duration-500"
                  style={{ width: `${80 + doneCount * 2}%` }}
                />
              </div>
            </div>
            <div className="rounded-xl bg-white p-3 shadow-sm">
              <p className="text-[10px] font-semibold text-[#111111]">Abba is 2 ahead of you</p>
              <p className="mt-0.5 text-[10px] text-black/55">Friendly competition, eternal rewards</p>
            </div>
          </div>
        )}
      </div>
      <div className="flex border-t border-black/[0.06] bg-white">
        {["Today", "Week", "Circle"].map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`flex-1 py-3 text-[10px] font-semibold tracking-[0.12em] uppercase transition-colors ${
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
    <div className="flex h-full flex-col bg-[#e8e4d8] pt-9" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}>
      <div className="bg-[#3d3a33] px-3 py-2">
        <p className="text-[11px] font-bold tracking-wide text-[#c9a227]">PSI CONSTRUCTION APP</p>
        <p className="text-[10px] text-white/50">v1.0.2 — update required</p>
      </div>
      <div className="bg-[#c9a227] px-3 py-1.5">
        <p className="text-[10px] font-bold text-[#3d3a33]">⚠️ CALL NOW FOR FREE ESTIMATE!!! ⚠️</p>
      </div>
      <div className="flex-1 overflow-hidden px-3 pt-2">
        {tab === 0 && (
          <div className="space-y-1.5">
            {["Home", "About Us", "Our Services", "Photo Gallery", "Request Estimate", "Insurance Info", "Testimonials", "Service Areas", "Contact Us", "Terms of Use"].map((m) => (
              <div key={m} className="flex items-center justify-between border-b border-black/10 bg-white px-2.5 py-1.5">
                <span className="text-[10px] text-[#3d3a33]">{m}</span>
                <span className="text-[10px] text-black/50">›</span>
              </div>
            ))}
          </div>
        )}
        {tab === 1 && (
          <div className="space-y-1.5">
            <div className="bg-white p-2">
              <p className="text-[10px] leading-relaxed text-[#444]">
                Photos coming soon. Please check back later. For examples of our work
                please visit our office or call during business hours (Mon-Fri 8-4)...
              </p>
            </div>
            <div className="bg-[#d6d0c0] p-2 text-center">
              <p className="text-[10px] text-black/60">[ image failed to load ]</p>
            </div>
            <div className="bg-[#d6d0c0] p-2 text-center">
              <p className="text-[10px] text-black/60">[ image failed to load ]</p>
            </div>
          </div>
        )}
        {tab === 2 && (
          <div className="bg-white p-2.5">
            <p className="text-[10px] font-bold text-[#3d3a33]">REQUEST AN ESTIMATE</p>
            <p className="mt-1 text-[10px] leading-relaxed text-black/60">
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
            className={`flex-1 py-3 text-[10px] font-bold tracking-wide uppercase ${
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
    <div className="mt-5 flex items-center justify-center gap-3">
      <a
        href="/quote"
        className="flex items-center gap-2.5 rounded-lg bg-[#111111] px-4 py-2 text-white transition-transform duration-200 hover:scale-[1.04]"
        aria-label="Download on the App Store"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white" aria-hidden>
          <path d="M17.05 12.54c-.03-2.89 2.36-4.27 2.47-4.34-1.35-1.97-3.44-2.24-4.18-2.27-1.78-.18-3.47 1.05-4.37 1.05-.9 0-2.29-1.02-3.77-1-1.94.03-3.72 1.13-4.72 2.86-2.01 3.49-.51 8.66 1.45 11.49.96 1.39 2.1 2.94 3.6 2.88 1.44-.06 1.99-.93 3.73-.93s2.23.93 3.76.9c1.55-.03 2.53-1.41 3.48-2.8 1.1-1.61 1.55-3.17 1.57-3.25-.03-.02-3.01-1.16-3.02-4.59zM14.17 4.06c.8-.96 1.33-2.3 1.18-3.64-1.14.05-2.53.76-3.35 1.72-.73.85-1.38 2.21-1.2 3.52 1.27.1 2.58-.65 3.37-1.6z" />
        </svg>
        <span className="text-left leading-none">
          <span className="block text-[10px] opacity-70">Download on the</span>
          <span className="block text-[13px] font-semibold">App Store</span>
        </span>
      </a>
      <a
        href="/quote"
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
          <span className="block text-[10px] opacity-70">Get it on</span>
          <span className="block text-[13px] font-semibold">Google Play</span>
        </span>
      </a>
    </div>
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
    <section className="bg-[#F5F5F3] px-6 pt-6 pb-24 text-[#111111]">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2
            className="mx-auto mt-4 max-w-3xl text-center text-3xl font-semibold tracking-[-0.035em] text-balance md:text-5xl md:leading-[1.06]"
            style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
          >
            It doesn&rsquo;t matter how good your backend is.
          </h2>
          <p
            className="mx-auto mt-3 max-w-2xl text-center text-base text-[#111111]/60 md:text-xl"
            style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
          >
            If your target audience doesn&rsquo;t use your app because of poor design,
            the engineering never gets its chance.
          </p>
        </Reveal>
        <SideToggle side={side} setSide={setSide} />

        <div className="relative mt-12 grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-10">
          <div className="pointer-events-none absolute top-[40%] left-1/2 z-20 hidden -translate-x-1/2 items-center justify-center lg:flex">
            <span
              className="flex h-14 w-14 items-center justify-center rounded-full border border-black/10 bg-white text-[13px] font-bold tracking-[0.08em] text-[#111111] shadow-[0_16px_40px_-12px_rgba(17,17,17,0.3)]"
              style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
            >
              VS
            </span>
          </div>

          {/* ---- AFTER: Mitzva ---- */}
          <Reveal delay={0.05} className={`${side === "after" ? "block" : "hidden"} lg:block`}>
            <div className="mb-5 text-center">
              <h3
                className="mt-1 text-2xl font-semibold tracking-[-0.035em] md:text-3xl"
                style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
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
                className="text-[10px] tracking-[0.24em] text-[#1e6b3c] uppercase"
                style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
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
                <li key={t} className="flex items-start gap-2.5 text-[14px] leading-relaxed text-[#111111]/70" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}>
                  <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-[#1e6b3c] text-[10px] font-bold text-white">✓</span>
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
                style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
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
                className="text-[10px] tracking-[0.24em] text-[#111111]/55 uppercase"
                style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
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
                <li key={t} className="flex items-start gap-2.5 text-[14px] leading-relaxed text-[#111111]/55" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}>
                  <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-black/20 text-[10px] font-bold text-white">✕</span>
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div className="mx-auto mt-16 max-w-5xl border-t border-black/[0.08] pt-10">
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
                    style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
                  >
                    {t}
                  </h4>
                  <p
                    className="mt-2 text-[13px] leading-relaxed text-[#111111]/55"
                    style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
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
  ["/assets/logos/aaa.png", "AAA", "h-8"],
  ["/assets/logos/uoft_ophtho.png", "University of Toronto — Dept. of Ophthalmology & Visual Sciences", "h-5"],
  ["/assets/logos/neuro_strabismus.png", "Neuro-Ophthalmology & Strabismus Fellowship — Division of Neurology", "h-6"],
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
            className={`${h} w-auto flex-none opacity-50 grayscale transition-opacity duration-300 hover:opacity-100 hover:grayscale-0`}
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
    <div ref={wrapRef} className="relative mt-12 h-[260vh]">
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center">
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
          style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) v.play().catch(() => {});
          else v.pause();
        }),
      { threshold: 0.25 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return (
    <section className="bg-white px-6 pt-28 pb-24 md:pt-32 text-[#111111]">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2
            className="max-w-3xl text-3xl font-semibold tracking-[-0.035em] text-balance md:text-5xl"
            style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
          >
            Design is art.
            <span className="text-[#1e6b3c]"> And art has a job.</span>
          </h2>
          <p
            className="mt-4 max-w-2xl text-base leading-relaxed text-[#111111]/60 md:text-lg"
            style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
          >
            The artist&rsquo;s job is to capture the core of what you want to
            convey — and express it to the world in the best perceivable way
            possible. Complex? We know. That&rsquo;s why you leave it up to us.
          </p>
          <p
            className="mt-3 max-w-2xl text-base leading-relaxed text-[#111111]/60 md:text-lg"
            style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
          >
            Everything that follows was designed meticulously for a client.
            Some use AI to create the bare minimum — our world-class team of
            artists leverages the strongest AI there is to build the best
            possible design, for every client.
          </p>
          <p
            className="mt-5 max-w-2xl border-l-2 border-[#1e6b3c] pl-4 text-base leading-relaxed font-medium text-[#111111]/75 md:text-lg"
            style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
          >
            Because the point of your business is to close the sale. Pour
            everything into backend code, and generic AI front-end design will
            still quietly kill it — if the UI/UX is bad, visitors don&rsquo;t
            become customers. And that&rsquo;s a real shame, because
            it&rsquo;s entirely avoidable.
          </p>
        </Reveal>

        {/* the PRIME showcase — scroll-controlled assembly cinematic */}
      </div>
      <div className="mx-auto max-w-6xl">
        <ScrollScrubVideo />
      </div>
      <div className="mx-auto max-w-6xl">
        {/* the layers — an ambient film, no tricks */}
        <Reveal delay={0.08}>
          <div className="mt-6 grid grid-cols-1 items-center gap-8 lg:grid-cols-5">
            <div className="overflow-hidden rounded-2xl shadow-[0_50px_110px_-50px_rgba(0,0,0,0.5)] lg:col-span-3">
              <video
                ref={videoRef}
                src="/assets/design_brand_white_v4.mp4"
                muted
                playsInline
                loop
                preload="metadata"
                className="w-full"
              />
            </div>
            <div className="lg:col-span-2">
              <h3
                className="text-2xl font-semibold tracking-[-0.035em] md:text-3xl"
                style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
              >
                Layer by layer.
                <br />
                Nothing accidental.
              </h3>
              <div className="mt-6 space-y-5">
                {[
                  ["The core", "We find what actually sells the product — and strip away everything competing with it."],
                  ["The optics", "Composition, lighting, and staging engineered so the eye lands exactly where it should."],
                  ["The layers", "Every element placed on purpose: components, shadows, reflections — nothing accidental."],
                ].map(([t, d]) => (
                  <div key={t} className="border-l-2 border-[#1e6b3c] pl-4">
                    <h4 className="text-[15px] font-semibold text-[#111111]" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}>
                      {t}
                    </h4>
                    <p className="mt-1 text-[14px] leading-relaxed text-[#111111]/55" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}>
                      {d}
                    </p>
                  </div>
                ))}
              </div>
              <a
                href="/quote"
                className="group mt-8 inline-flex items-center gap-3 rounded-full border border-[#111111]/20 px-7 py-3 text-[11px] tracking-[0.26em] text-[#111111] uppercase transition-all duration-300 hover:border-[#1e6b3c] hover:bg-[#1e6b3c] hover:text-white"
                style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
              >
                Stage my product
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </a>
            </div>
          </div>
        </Reveal>
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
                ["/assets/logos/uoft_ophtho.png", "University of Toronto — Dept. of Ophthalmology & Visual Sciences", "h-5 md:h-6"],
                ["/assets/logos/neuro_strabismus.png", "Neuro-Ophthalmology & Strabismus Fellowship — Division of Neurology", "h-6 md:h-7"],
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
type Mini = { name: string; before: React.JSX.Element; after: React.JSX.Element; desc: string; link?: string };

const bar = (w: string, c: string, h = "h-2") => (
  <div className={`${h} ${w} rounded-sm`} style={{ backgroundColor: c }} />
);

const CASES: Mini[] = [
  {
    name: "Dialog Healthcare",
    desc: "A staffing site rebuilt around one promise — the right clinician, placed fast.",
    link: "https://dialoghealthcare.com",
    before: (
      <div className="pointer-events-none h-full w-full overflow-hidden bg-white">
        <LazyFrame
          src="https://dialoghealthcare.com"
          title="Dialog Healthcare — their current website"
          interactive={false}
          zoom={0.25}
        />
      </div>
    ),
    after: (
      <div className="h-full w-full bg-white p-3" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-tight text-[#111111]">Dialog<span className="text-[#111111]/55"> Healthcare</span></span>
          <span className="rounded-full bg-[#1e6b3c] px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.14em] text-white uppercase">Request staff</span>
        </div>
        <p className="mt-3 text-[13px] leading-tight font-semibold tracking-[-0.035em] text-[#111111]">The right clinician.<br />Placed in days, not months.</p>
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
    link: "https://www.psiconstructionpa.com",
    before: (
      <div className="h-full w-full bg-white">
        <div className="flex items-center justify-between px-3 py-1.5">
          <img src="/assets/psi_logo_v1.png" alt="" className="h-6 w-auto object-contain" />
          <div className="flex gap-2">
            {["Home", "Services", "Contact"].map((m) => (
              <span key={m} className="text-[10px] text-black/60">{m}</span>
            ))}
          </div>
        </div>
        <div className="relative h-[62%] w-full overflow-hidden">
          <img src="/assets/psi_hero_v1.jpg" alt="PSI Construction original homepage" className="h-full w-full object-cover" />
        </div>
        <div className="px-3 pt-2 text-center">
          <p className="text-[10px] font-bold tracking-wide text-[#2b2b2b]">Our Services</p>
          <div className="mx-auto mt-1.5 flex justify-center gap-1.5">
            <div className="h-6 w-1/4 rounded-sm bg-[#e8e4dc]" />
            <div className="h-6 w-1/4 rounded-sm bg-[#e8e4dc]" />
            <div className="h-6 w-1/4 rounded-sm bg-[#e8e4dc]" />
          </div>
        </div>
      </div>
    ),
    after: (
      <div className="h-full w-full bg-[#15140f] p-3 text-white" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase">PSI<span className="text-[#d9a441]"> Construction</span></span>
          <span className="rounded-full border border-white/25 px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.14em] uppercase">Get a bid</span>
        </div>
        <p className="mt-3 text-[13px] leading-tight font-semibold tracking-[-0.035em]">Built to outlast<br />the blueprint.</p>
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
      <div className="h-full w-full bg-[#FBFAF7] p-3" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold tracking-[0.12em] text-[#14140f]" style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "11px" }}>
            Michael Elbaz Law
          </span>
          <span className="rounded-full bg-[#14140f] px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.14em] text-white uppercase">Consultation</span>
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
    <section className="bg-[#F5F5F3] px-6 pt-6 pb-24 text-[#111111]">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2
            className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.035em] md:text-5xl"
            style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
          >
            Real websites, completely uplifted.
          </h2>
          <p className="mt-3 max-w-xl text-base text-[#111111]/60" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}>
            Every card leads with the after — the before sits small in the corner, where it belongs. Hover it to look closer.
          </p>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {CASES.map((c, i) => (
            <Reveal key={c.name} delay={i * 0.08}>
              <div className="group">
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-black/[0.07] bg-white shadow-[0_18px_44px_-28px_rgba(17,17,17,0.3)]">
                  {c.after}
                  <span
                    className="absolute top-2.5 right-2.5 rounded-sm bg-[#1e6b3c] px-2.5 py-1 text-[10px] font-bold tracking-[0.22em] text-white uppercase"
                    style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
                  >
                    After — ELSIAA
                  </span>
                  {/* the before, pinned small in the corner — grows on hover */}
                  <div className="absolute bottom-2.5 left-2.5 w-[38%] overflow-hidden rounded-md border-2 border-white shadow-[0_14px_34px_-10px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-[1.9] group-hover:origin-bottom-left">
                    <div className="aspect-[4/3]">{c.before}</div>
                    <span
                      className="absolute top-1 left-1 rounded-sm bg-black/65 px-1.5 py-0.5 text-[10px] font-bold tracking-[0.16em] text-white uppercase"
                      style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
                    >
                      Before
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <h3 className="text-[15px] font-semibold" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}>
                    {c.name}
                  </h3>
                  <a
                    href={c.link ?? "/contact"}
                    target={c.link ? "_blank" : undefined}
                    rel={c.link ? "noreferrer" : undefined}
                    className="text-[10px] tracking-[0.22em] text-[#1e6b3c] uppercase transition-colors hover:text-[#2e9e58]"
                    style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
                  >
                    {c.link ? "View original ↗" : "View case study →"}
                  </a>
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[#111111]/60" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}>
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
    <section className="bg-gradient-to-b from-[#F5F5F3] to-white pt-24 pb-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="mt-3 flex items-end justify-between gap-6">
            <h2
              className="max-w-2xl text-3xl font-semibold tracking-[-0.035em] text-[#111111] md:text-5xl"
              style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
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
          <p className="mt-3 max-w-xl text-base text-[#111111]/60" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}>
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
        className="mt-12 flex gap-4 overflow-x-auto px-6 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {[...APPS, ...APPS].map(([t, d], i) => (
          <div
            key={`${t}-${i}`}
            className="group flex w-[280px] flex-none flex-col rounded-2xl border border-black/[0.06] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#1e6b3c]/30 hover:shadow-[0_24px_60px_-30px_rgba(30,107,60,0.35)]"
          >
            <span
              className="text-[10px] tracking-[0.3em] text-[#1e6b3c]"
              style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
            >
              {String((i % APPS.length) + 1).padStart(2, "0")}
            </span>
            <h3
              className="mt-3 text-[17px] leading-snug font-semibold tracking-[-0.02em] text-[#111111]"
              style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
            >
              {t}
            </h3>
            <p
              className="mt-2 text-[13px] leading-relaxed text-[#111111]/60"
              style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
            >
              {d}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- the process — how every uplift actually happens ---------------- */
function OurProcess() {
  const STEPS = [
    ["01", "Immersion", "Before anything is designed, we study the business: your market, your customers, and precisely what \u201cbetter received\u201d means for you. Every engagement begins as research, not aesthetics."],
    ["02", "Sketch-first ideation", "Concepts are drawn by hand before a pixel exists. Structure gets decided by thinking, never by templates \u2014 which is why no two ELSIAA builds look alike."],
    ["03", "Directed generation", "Our proprietary AI production pipeline turns creative direction into studio-grade assets \u2014 imagery, film, and interfaces \u2014 at a pace traditional studios cannot match."],
    ["04", "Live assembly", "Designs are built as working software from day one and reviewed in the real medium. We don\u2019t present mockups of the thing; we present the thing."],
    ["05", "Ruthless iteration", "Work is measured against the standard, not the effort. Anything below the bar is rebuilt \u2014 in hours, not sprints \u2014 until every detail holds."],
    ["06", "Launch & refinement", "The work ships live, then keeps improving against real visitor behavior. Delivery is the beginning of the standard, not the end of it."],
  ];
  return (
    <section className="bg-[#F5F5F3] px-6 py-24 text-[#111111]">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p
            className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase"
            style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
          >
            The ELSIAA process
          </p>
          <h2
            className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.035em] md:text-5xl"
            style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
          >
            Every uplift runs the same road.
          </h2>
          <p className="mt-3 max-w-xl text-base text-[#111111]/60" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}>
            Six stages, one direction — from understanding your business to a living
            product that keeps getting better.
          </p>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-x-10 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
          {STEPS.map(([n, t, d], i) => (
            <Reveal key={n} delay={(i % 3) * 0.07}>
              <div className="border-t border-black/10 pt-5">
                <div className="flex items-baseline justify-between">
                  <h3
                    className="text-lg font-semibold tracking-[-0.02em]"
                    style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
                  >
                    {t}
                  </h3>
                  <span
                    className="text-[11px] tracking-[0.3em] text-[#1e6b3c]"
                    style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
                  >
                    {n}
                  </span>
                </div>
                <p
                  className="mt-2.5 text-[14px] leading-relaxed text-[#111111]/55"
                  style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
                >
                  {d}
                </p>
              </div>
            </Reveal>
          ))}
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
              className="text-5xl font-semibold tracking-[-0.035em] text-[#111111] md:text-7xl"
              style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
            >
              <Counter to={x.n} suffix={x.s} />
            </p>
            <p
              className="mt-3 text-sm text-[#111111]/55"
              style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
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
    <section className="bg-[#070907] px-6 py-32 text-center text-[#F5F5F3]">
      <Reveal>
        <p
          className="text-[11px] tracking-[0.42em] text-[#2e9e58] uppercase"
          style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
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
          className="group mt-12 inline-flex items-center gap-3 border border-[#F5F5F3]/25 px-9 py-3.5 text-[11px] tracking-[0.3em] uppercase transition-colors duration-300 hover:border-[#2e9e58] hover:text-[#2e9e58]"
          style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
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
      <ProductAdFeature />
      <ClientLogos />
      <BeyondWebsites />
      <DiscoverDesigns />
      <Ticker />
      <Transformations />
      <DiscoverApps />
      <OurProcess />
      <Results />
    </>
  );
}

export { FinalCTA as DesignsFinalCTA };
