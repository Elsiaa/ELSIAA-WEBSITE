import { useEffect, useRef } from "react";

// Apple-keynote style: enormous, quiet, confident type on white.
// Each caption grows as it enters, locking to full size at center.

const CAPTIONS: { line: string; sub?: string }[] = [
  { line: "Design.", sub: "Every pixel, deliberate." },
  { line: "Automation.", sub: "Work that runs itself." },
  { line: "Intelligence.", sub: "AI woven into the business, not bolted on." },
  { line: "Every detail.", sub: "Considered. Crafted. Delivered." },
  { line: "AI, done better." },
];

function Caption({ line, sub }: { line: string; sub?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const tick = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when entering from below, 1 at center
      const t = Math.min(1, Math.max(0, 1 - Math.abs(r.top + r.height / 2 - vh / 2) / (vh * 0.75)));
      const scale = 0.72 + t * 0.28;
      el.style.transform = `scale(${scale})`;
      el.style.opacity = String(0.15 + t * 0.85);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section className="flex min-h-[92svh] items-center justify-center px-6">
      <div ref={ref} className="text-center will-change-transform">
        <h2
          className="text-6xl font-semibold tracking-[-0.03em] text-[#111111] md:text-[7.5rem] md:leading-[1.02]"
          style={{ fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
        >
          {line}
        </h2>
        {sub && (
          <p
            className="mt-6 text-lg text-[#111111]/55 md:text-2xl"
            style={{ fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif", fontWeight: 400 }}
          >
            {sub}
          </p>
        )}
      </div>
    </section>
  );
}

export function AppleCaptions() {
  return (
    <div className="bg-white">
      {CAPTIONS.map((c) => (
        <Caption key={c.line} line={c.line} sub={c.sub} />
      ))}
    </div>
  );
}
