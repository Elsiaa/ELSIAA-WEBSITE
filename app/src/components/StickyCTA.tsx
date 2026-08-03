import { useEffect, useState } from "react";

/* Mobile-only sticky conversion bar — one primary action, always in thumb reach.
   Appears after the hero scrolls away; hides on md+. */
export function StickyCTA() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > window.innerHeight * 0.85);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-black/[0.06] bg-white/95 px-4 pt-3 backdrop-blur-md transition-transform duration-300 md:hidden ${show ? "translate-y-0" : "translate-y-full"}`}
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))", fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
    >
      <a
        href="/contact"
        className="flex min-h-[48px] w-full items-center justify-center rounded-full bg-[#1e6b3c] text-[15px] font-semibold text-white transition-opacity active:opacity-80"
      >
        Book a free 20-min call →
      </a>
    </div>
  );
}
