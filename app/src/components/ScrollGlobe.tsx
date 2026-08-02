import { useEffect, useRef, useState } from "react";

/*
  ELSIAA globe — a photoreal Earth rendered on a 2D canvas, no libraries.
  A real Blue-Marble equirectangular texture is projected onto a sphere
  (orthographic), lit by a fixed side-light so the planet reads half in
  daylight and half in night, sitting on a perfect white background.
  Rotation = scroll-driven spin + gentle ambient + drag (with inertia).
  Office cities glow emerald — softly on the day side, brighter on the night
  side, like city lights. Reduced-motion: static, scroll/drag still allowed.
*/

const OFFICES = [
  { name: "New York", lat: 40.75, lon: -73.98 },
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
  // x → prime meridian, y → north pole, z → 90°E
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

export function ScrollGlobe({ size = 440 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tilt = -0.34; // fixed viewing tilt so the northern hemisphere leads

    // fixed side light (view space) → a stable day/night terminator: the right
    // hemisphere (Atlantic / Europe / Africa) sits in bright daylight, the left
    // limb falls into night. normalised.
    let Lx = 0.47, Ly = -0.14, Lz = 0.73;
    {
      const m = Math.hypot(Lx, Ly, Lz);
      Lx /= m; Ly /= m; Lz /= m;
    }

    // ── texture (sampled via an offscreen buffer) ──
    let ready = false;
    let TW = 0, TH = 0;
    let tdata: Uint8ClampedArray | null = null;
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      TW = img.naturalWidth;
      TH = img.naturalHeight;
      const off = document.createElement("canvas");
      off.width = TW;
      off.height = TH;
      const octx = off.getContext("2d");
      if (!octx) return;
      octx.drawImage(img, 0, 0);
      try {
        tdata = octx.getImageData(0, 0, TW, TH).data;
        ready = true;
      } catch {
        ready = false;
      }
    };
    img.src = "/assets/earth_equirect.png";

    // ── sizing (display vs. internal render resolution) ──
    // Render at device-pixel density (capped) so the sphere is crisp, not soft.
    const INT_CAP = 420;
    let dispPx = size;
    let intPx = size;
    let buf: ImageData | null = null;
    const resize = () => {
      const parent = canvas.parentElement;
      const w = parent ? parent.getBoundingClientRect().width : size;
      // floor low enough that a small mobile column still shrinks the globe
      dispPx = Math.round(Math.max(150, Math.min(w > 0 ? w : size, size)));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      intPx = Math.round(Math.min(dispPx * dpr, INT_CAP));
      canvas.width = intPx;
      canvas.height = intPx;
      canvas.style.width = `${dispPx}px`;
      canvas.style.height = `${dispPx}px`;
      buf = ctx.createImageData(intPx, intPx);
    };
    resize();
    requestAnimationFrame(resize);
    window.addEventListener("resize", resize);
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => resize()) : null;
    if (ro && canvas.parentElement) ro.observe(canvas.parentElement);

    // ── interaction ──
    let dragYaw = 0, vel = 0, dragging = false, lastX = 0;
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

    let raf = 0;
    let lastYaw = Number.NaN;
    let t0 = 0; // anchor ambient spin to mount, not the raw clock, so every
    // fresh load starts at the same Atlantic framing (and never drifts far)

    const draw = (t: number) => {
      if (!t0) t0 = t;
      if (!dragging) {
        dragYaw += vel;
        vel *= 0.94;
      }
      const auto = reduced ? 0 : (t - t0) * 0.00003;
      // fast scroll spin: ≈2 full revolutions within the ~420px of scroll that
      // the hero globe is on screen, so it visibly whips around twice.
      const scrollSpin = reduced ? 0 : (window.scrollY || 0) * 0.03;
      // base yaw ≈ centres the Atlantic at first paint: Americas on the left,
      // Europe & Africa on the right — the iconic Blue-Marble framing, lit.
      const yaw = 4.2 + auto + scrollSpin + dragYaw;

      const cx = intPx / 2;
      const cy = intPx / 2;
      const R = (intPx / 2) * 0.95;

      if (!ready || !tdata || !buf) {
        // faint placeholder disc until the texture decodes
        ctx.clearRect(0, 0, intPx, intPx);
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(17,17,17,0.10)";
        ctx.lineWidth = 1;
        ctx.stroke();
        raf = requestAnimationFrame(draw);
        return;
      }

      // skip the whole raster when the globe is scrolled off screen (saves CPU)
      const vr = canvas.getBoundingClientRect();
      if (vr.bottom < -60 || vr.top > window.innerHeight + 60) {
        raf = requestAnimationFrame(draw);
        return;
      }

      // skip the expensive raster when nothing moved (idle w/ reduced motion)
      const moved = Number.isNaN(lastYaw) || Math.abs(yaw - lastYaw) > 0.0002;
      if (moved) {
        lastYaw = yaw;
        const d = buf.data;
        const cyaw = Math.cos(-yaw), syaw = Math.sin(-yaw);
        const ctl = Math.cos(-tilt), stl = Math.sin(-tilt);
        const invR = 1 / R;

        for (let py = 0; py < intPx; py++) {
          const nyRow = (py - cy) * invR;
          let o = py * intPx * 4;
          for (let px = 0; px < intPx; px++, o += 4) {
            const nx = (px - cx) * invR;
            const d2 = nx * nx + nyRow * nyRow;
            if (d2 > 1) {
              d[o + 3] = 0;
              continue;
            }
            const nz = Math.sqrt(1 - d2);
            // view-space surface normal (screen-y down → world-y up)
            const vx = nx, vy = -nyRow, vz = nz;
            // undo tilt (rotX by −tilt), then yaw (rotY by −yaw) → world point
            const y1 = vy * ctl - vz * stl;
            const z1 = vy * stl + vz * ctl;
            const wx = vx * cyaw + z1 * syaw;
            const wy = y1;
            const wz = -vx * syaw + z1 * cyaw;
            // world unit vector → lat/lon → equirectangular uv
            const u = (Math.atan2(wz, wx) + Math.PI) * (0.5 / Math.PI);
            const v = (Math.PI / 2 - Math.asin(wy < -1 ? -1 : wy > 1 ? 1 : wy)) * (1 / Math.PI);
            let tx = (u * TW) | 0;
            let ty = (v * TH) | 0;
            if (tx >= TW) tx = TW - 1; else if (tx < 0) tx = 0;
            if (ty >= TH) ty = TH - 1; else if (ty < 0) ty = 0;
            const ti = (ty * TW + tx) * 4;
            let r = tdata[ti], g = tdata[ti + 1], b = tdata[ti + 2];

            // day/night: fixed side light → half lit, half dark
            const shade = vx * Lx + vy * Ly + vz * Lz;
            const lit = smooth(-0.18, 0.12, shade); // 0 night · 1 day
            const dayB = 1.16 + 0.36 * (shade > 0 ? shade : 0); // brighter day so land pops
            const bf = 0.07 + (dayB - 0.07) * lit;
            r *= bf; g *= bf; b *= bf;
            // cool the night side toward deep blue-black
            if (lit < 1) {
              const nightAmt = (1 - lit);
              b += (30 - b) * nightAmt * 0.45;
              r *= 1 - nightAmt * 0.25;
              g *= 1 - nightAmt * 0.12;
            }
            const rr = Math.sqrt(d2);
            // spherical volume: darken toward the limb
            const rim = 1 - 0.42 * d2 * d2;
            r *= rim; g *= rim; b *= rim;
            // atmospheric limb — a bright blue halo on the sunlit edge (the
            // single biggest "this is a real planet" cue)
            const limb = smooth(0.86, 1.0, rr);
            if (limb > 0 && lit > 0.05) {
              const glow = limb * lit;
              r += 120 * glow * 0.35;
              g += 165 * glow * 0.55;
              b += 255 * glow * 0.8;
            }

            // antialiased rim → melt into the white page
            let a = 255;
            if (rr > 0.985) a = 255 * clamp01((1 - rr) / 0.015);

            d[o] = r > 255 ? 255 : r;
            d[o + 1] = g > 255 ? 255 : g;
            d[o + 2] = b > 255 ? 255 : b;
            d[o + 3] = a;
          }
        }
        ctx.putImageData(buf, 0, 0);

        // ── office markers (drawn over the raster each rendered frame) ──
        for (const oc of officeVecs) {
          const rv = rotX(rotY(oc.v, yaw), tilt); // world → view
          if (rv.z <= 0.02) continue; // back hemisphere
          const sx = cx + rv.x * R;
          const sy = cy - rv.y * R;
          const shadeM = rv.x * Lx + rv.y * Ly + rv.z * Lz;
          const night = shadeM < 0.02;
          const pulse = 1 + Math.sin(t * 0.004 + oc.lon) * 0.28;
          // glow
          ctx.beginPath();
          ctx.arc(sx, sy, (night ? 4.2 : 3.4) * pulse, 0, Math.PI * 2);
          ctx.fillStyle = night ? "rgba(120,240,170,0.45)" : "rgba(30,107,60,0.28)";
          ctx.fill();
          // core
          ctx.beginPath();
          ctx.arc(sx, sy, 1.7, 0, Math.PI * 2);
          ctx.fillStyle = night ? "#d8ffe8" : "#1e6b3c";
          ctx.fill();
        }
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
      aria-label="ELSIAA offices on a photoreal rotating globe — scroll or drag to spin"
      className="mx-auto block cursor-grab touch-pan-y select-none active:cursor-grabbing"
      style={{ filter: "drop-shadow(0 26px 40px rgba(18,28,60,0.24))" }}
    />
  );
}

function clamp01(x: number) {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}
function smooth(a: number, b: number, x: number) {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
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
