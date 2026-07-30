import { useEffect, useRef, useState } from "react";

/*
  ELSIAA globe — a wireframe 3D globe drawn on canvas, no libraries.
  Emerald graticule on white, office markers with pulses, great-circle
  arcs from New York to every office. Rotation = slow ambient spin
  + scroll-driven spin + drag (with inertia). Reduced-motion: static.
*/

const OFFICES = [
  { name: "New York", lat: 40.75, lon: -73.98, hub: true },
  { name: "Los Angeles", lat: 34.05, lon: -118.24 },
  { name: "London", lat: 51.51, lon: -0.13 },
  { name: "Geneva", lat: 46.2, lon: 6.14 },
  { name: "Antwerp", lat: 51.22, lon: 4.4 },
  { name: "Tel Aviv", lat: 32.07, lon: 34.79 },
];

type V3 = { x: number; y: number; z: number };

function toVec(lat: number, lon: number): V3 {
  const la = (lat * Math.PI) / 180;
  const lo = (lon * Math.PI) / 180;
  return {
    x: Math.cos(la) * Math.cos(lo),
    y: Math.sin(la),
    z: Math.cos(la) * Math.sin(lo),
  };
}

function rotY(v: V3, a: number): V3 {
  const c = Math.cos(a), s = Math.sin(a);
  return { x: v.x * c + v.z * s, y: v.y, z: -v.x * s + v.z * c };
}
function rotX(v: V3, a: number): V3 {
  const c = Math.cos(a), s = Math.sin(a);
  return { x: v.x, y: v.y * c - v.z * s, z: v.y * s + v.z * c };
}

function slerp(a: V3, b: V3, t: number): V3 {
  const dot = Math.max(-1, Math.min(1, a.x * b.x + a.y * b.y + a.z * b.z));
  const th = Math.acos(dot);
  if (th < 1e-4) return a;
  const s = Math.sin(th);
  const w1 = Math.sin((1 - t) * th) / s;
  const w2 = Math.sin(t * th) / s;
  return { x: a.x * w1 + b.x * w2, y: a.y * w1 + b.y * w2, z: a.z * w1 + b.z * w2 };
}

export function ScrollGlobe({ size = 420 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let dragYaw = 0;
    let vel = 0;
    let dragging = false;
    let lastX = 0;
    const tilt = -0.42;

    let px = size;
    const resize = () => {
      const parent = canvas.parentElement;
      const w = parent ? parent.getBoundingClientRect().width : size;
      // clamp: never collapse to a sliver if the parent hasn't laid out yet,
      // never exceed the requested size. (Fixes the globe rendering tiny.)
      px = Math.round(Math.max(220, Math.min(w > 0 ? w : size, size)));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = px * dpr;
      canvas.height = px * dpr;
      canvas.style.width = `${px}px`;
      canvas.style.height = `${px}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    // re-measure on the next frame in case the parent hadn't been laid out yet
    requestAnimationFrame(resize);
    window.addEventListener("resize", resize);
    // track the parent column width directly so a resized/reflowed layout
    // always re-fits the globe (more reliable than window resize alone)
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => resize()) : null;
    if (ro && canvas.parentElement) ro.observe(canvas.parentElement);

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      vel = 0;
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      dragYaw += dx * 0.006;
      vel = dx * 0.006;
    };
    const onUp = () => {
      dragging = false;
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    const officeVecs = OFFICES.map((o) => ({ ...o, v: toVec(o.lat, o.lon) }));
    const hub = officeVecs.find((o) => o.hub)!;

    const draw = (t: number) => {
      if (!dragging) {
        dragYaw += vel;
        vel *= 0.94;
      }
      // gentle ambient spin + drag only. (The old scroll-driven spin whipped
      // the globe around as you scrolled the page — dizzying and awkward with a
      // mouse; drag + a calm auto-rotate reads as intentional on desktop.)
      const auto = reduced ? 0 : t * 0.00008;
      const yaw = 1.9 + auto + dragYaw;

      const cx = px / 2;
      const cy = px / 2;
      // keep generous margin so the rim, the lifted arcs (up to ~1.08·R) and
      // the city labels never clip against the canvas edge as the globe turns
      const R = px * 0.35;

      const proj = (v: V3) => {
        const r = rotX(rotY(v, yaw), tilt);
        return { x: cx + r.x * R, y: cy - r.y * R, z: r.z };
      };

      ctx.clearRect(0, 0, px, px);

      // sphere rim
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(17,17,17,0.14)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // graticule
      const seg = 90;
      const strokeFront = "rgba(17,17,17,0.10)";
      const strokeBack = "rgba(30,107,60,0.05)";
      const drawCircle = (pointAt: (i: number) => V3) => {
        for (let pass = 0; pass < 2; pass++) {
          ctx.beginPath();
          let pen = false;
          for (let i = 0; i <= seg; i++) {
            const p = proj(pointAt(i));
            const front = p.z <= 0;
            const want = pass === 1 ? front : !front;
            if (want) {
              if (!pen) {
                ctx.moveTo(p.x, p.y);
                pen = true;
              } else ctx.lineTo(p.x, p.y);
            } else pen = false;
          }
          ctx.strokeStyle = pass === 1 ? strokeFront : strokeBack;
          ctx.lineWidth = pass === 1 ? 1 : 0.8;
          ctx.stroke();
        }
      };
      for (let lat = -60; lat <= 60; lat += 30) {
        drawCircle((i) => toVec(lat, (i / seg) * 360 - 180));
      }
      for (let lon = -180; lon < 180; lon += 30) {
        drawCircle((i) => toVec((i / seg) * 180 - 90, lon));
      }

      // arcs from the hub
      for (const o of officeVecs) {
        if (o.hub) continue;
        ctx.beginPath();
        let pen = false;
        for (let i = 0; i <= 60; i++) {
          const m = slerp(hub.v, o.v, i / 60);
          // lift the arc off the surface
          const lift = 1 + 0.08 * Math.sin((i / 60) * Math.PI);
          const p = proj({ x: m.x * lift, y: m.y * lift, z: m.z * lift });
          if (p.z <= 0.12) {
            if (!pen) {
              ctx.moveTo(p.x, p.y);
              pen = true;
            } else ctx.lineTo(p.x, p.y);
          } else pen = false;
        }
        ctx.strokeStyle = "rgba(30,107,60,0.45)";
        ctx.lineWidth = 1.1;
        ctx.stroke();
      }

      // office markers
      ctx.font = "600 10px -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif";
      const visible: Array<{ o: (typeof officeVecs)[number]; p: { x: number; y: number; z: number } }> = [];
      for (const o of officeVecs) {
        const p = proj(o.v);
        if (p.z > 0.05) continue; // back side
        visible.push({ o, p });
        const pulse = 2.6 + Math.sin(t * 0.004 + o.lon) * 0.9;
        ctx.beginPath();
        ctx.arc(p.x, p.y, pulse + 3.4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(30,107,60,0.12)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.1, 0, Math.PI * 2);
        ctx.fillStyle = "#1e6b3c";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.1, 0, Math.PI * 2);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      // labels — placed after all markers, nudged apart so neighbouring
      // cities (London/Antwerp/Geneva) never overlap into unreadable text
      const placedLabels: Array<{ x: number; y: number; w: number }> = [];
      visible.sort((a, b) => a.p.y - b.p.y);
      ctx.fillStyle = "rgba(17,17,17,0.62)";
      for (const { o, p } of visible) {
        const text = o.name.toUpperCase();
        const w = ctx.measureText(text).width;
        let lx = p.x + 8;
        if (lx + w > px - 2) lx = p.x - 8 - w; // flip left near the edge
        let ly = p.y + 3;
        let moved = true;
        let guard = 0;
        while (moved && guard++ < 24) {
          moved = false;
          for (const r of placedLabels) {
            const xOverlap = lx < r.x + r.w + 8 && r.x < lx + w + 8;
            if (xOverlap && Math.abs(ly - r.y) < 11) {
              ly = r.y + 11;
              moved = true;
            }
          }
        }
        placedLabels.push({ x: lx, y: ly, w });
        ctx.fillText(text, lx, ly);
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      ro?.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      aria-label="ELSIAA offices on a rotating globe — drag to spin"
      className="mx-auto block cursor-grab touch-pan-y select-none active:cursor-grabbing"
    />
  );
}

/* count-up for the numbers around the globe.
   Renders the FINAL value by default (SSR, crawlers, reduced motion, any
   missed trigger) and only animates from 0 as a progressive enhancement.
   A watchdog snaps to the target so the real number is always shown. */
export function CountTo({
  target,
  suffix = "",
  duration = 1400,
}: {
  target: number;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [val, setVal] = useState(target);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return; // keep the final value, no animation
    }
    let raf = 0;
    let watchdog = 0;
    const run = () => {
      const t0 = performance.now();
      const tick = (t: number) => {
        const k = Math.min(1, (t - t0) / duration);
        setVal(Math.round(target * (1 - Math.pow(1 - k, 3))));
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      watchdog = window.setTimeout(() => {
        cancelAnimationFrame(raf);
        setVal(target);
      }, duration + 1500);
    };
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) {
      run();
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(watchdog);
      };
    }
    const io = new IntersectionObserver(
      (es) => {
        if (!es[0].isIntersecting) return;
        io.disconnect();
        run();
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(watchdog);
    };
  }, [target, duration]);
  return (
    <span ref={ref} className="tabular-nums">
      {val}
      {suffix}
    </span>
  );
}
