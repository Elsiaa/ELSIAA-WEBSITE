import { useEffect, useRef, useState } from "react";

/*
  Shared scroll-reveal — fails open.
  Content is only ever hidden when we KNOW the animation can run and the
  element is genuinely below the viewport. Reduced motion, missing
  IntersectionObserver, or an element already in (or above) view all render
  immediately — no blank viewports, no content lost to a missed trigger.
*/
export function Reveal({
  children,
  delay = 0,
  className = "",
  /* Anything else lands on the wrapper div — data-* hooks in particular, so a
     caller can target the revealed block without adding another wrapper. */
  ...rest
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setOn(true);
      return;
    }
    // Already visible (or scrolled past) on mount — show right away.
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.95 || r.bottom < 0) {
      setOn(true);
      return;
    }
    // Trigger a little BEFORE the element enters, so fast scrolling never
    // lands on an empty viewport.
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && (setOn(true), io.disconnect()),
      { threshold: 0.01, rootMargin: "0px 0px 15% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      {...rest}
      className={className}
      style={{
        opacity: on ? 1 : 0,
        transform: on ? "none" : "translateY(18px)",
        transition: `opacity .55s ease ${delay}s, transform .55s cubic-bezier(.2,.8,.2,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}
