import { useEffect, useState } from "react";
import { ElsiaaChat } from "./ElsiaaChat";

/*
  Floating "Book a call" pill — appears after the reader is invested
  (~600px of scroll), pinned bottom-right above the safe area,
  dismissible for the session. Hidden on the portal.
*/
export function FloatingBook() {
  const [show, setShow] = useState(false);
  const [dead, setDead] = useState(true);
  const [chat, setChat] = useState(false);

  useEffect(() => {
    if (window.location.pathname.startsWith("/portal")) return;
    if (window.location.pathname.startsWith("/admin")) return;
    if (window.location.pathname.startsWith("/pay")) return;
    if (sessionStorage.getItem("elsiaa-book-dismissed")) return;
    setDead(false);
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (dead) return null;
  return (
    <>
      <div
        className="fixed right-4 z-40 hidden transition-all duration-500 md:block"
        style={{
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
          opacity: show ? 1 : 0,
          transform: show ? "none" : "translateY(16px)",
          pointerEvents: show ? "auto" : "none",
        }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setChat(true)}
            className="flex min-h-[48px] items-center gap-2 rounded-full border border-black/10 bg-white pl-5 pr-6 text-[13px] font-bold text-[#111111] shadow-[0_18px_44px_-18px_rgba(0,0,0,0.35)] transition-colors hover:border-[#1e6b3c] hover:text-[#1e6b3c]"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            <img
              src="/assets/quote/robot.png"
              alt=""
              width={56}
              height={56}
              className="h-7 w-7 object-contain"
            />
            Chat with ELSIAA
          </button>
          <div className="flex items-center gap-1.5 rounded-full bg-[#111111] pl-6 pr-2 shadow-[0_18px_44px_-18px_rgba(0,0,0,0.5)]">
            <a
              href="/contact"
              className="flex min-h-[48px] items-center text-[13px] font-bold text-white "
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Book a call →
            </a>
            <button
              aria-label="Dismiss"
              onClick={() => {
                sessionStorage.setItem("elsiaa-book-dismissed", "1");
                setDead(true);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/50 transition-colors hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
      <ElsiaaChat open={chat} onClose={() => setChat(false)} />
    </>
  );
}
