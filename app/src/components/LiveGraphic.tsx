import { useEffect, useRef } from "react";

/*
  LiveGraphic — the shared division-graphic player.
  A looping white-studio video that sits directly on the white page:
  plays in view, pauses off-screen, and a soft white edge veil dissolves
  all four borders into the background so the scene never reads as a
  cut-off rectangle at any point of the loop.
*/
export function LiveGraphic({
  src,
  poster,
  ratio = "aspect-[3/2]",
}: {
  src: string;
  poster?: string;
  ratio?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  /*
    Constant autoplay. This used to pause the clip whenever it left the
    viewport, so scrolling back returned to a frozen robot until the observer
    fired again. It now just keeps playing, and a watchdog restarts it if the
    browser stops it for us — which happens on tab-switch, on returning from
    background, and when a decoder is reclaimed under memory pressure.
    Reduced motion still gets a still frame.
  */
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      v.pause();
      return;
    }
    const resume = () => {
      if (v.paused) v.play().catch(() => {});
    };
    resume();
    v.addEventListener("pause", resume);
    document.addEventListener("visibilitychange", resume);
    // last resort: some engines stall without firing `pause` at all
    const t = setInterval(resume, 4000);
    return () => {
      v.removeEventListener("pause", resume);
      document.removeEventListener("visibilitychange", resume);
      clearInterval(t);
    };
  }, []);

  return (
    <div className={`relative ${ratio} w-full bg-white`}>
      <video
        ref={ref}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        /* auto, not metadata: with metadata the first play stuttered while the
           clip buffered, and autoplay needs data ready to start at all */
        preload="auto"
        poster={poster}
        className="absolute inset-0 h-full w-full object-contain mix-blend-multiply"
      />
      {/* soft white veil — edges of the scene dissolve into the page */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, #ffffff, rgba(255,255,255,0) 7%, rgba(255,255,255,0) 93%, #ffffff), linear-gradient(to bottom, #ffffff, rgba(255,255,255,0) 7%, rgba(255,255,255,0) 93%, #ffffff)",
        }}
      />
    </div>
  );
}
