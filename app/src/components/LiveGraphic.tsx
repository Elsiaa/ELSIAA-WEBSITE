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

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(
      (e) => {
        if (e[0].isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.2 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <div className={`relative ${ratio} w-full bg-white`}>
      <video
        ref={ref}
        src={src}
        loop
        muted
        playsInline
        preload="metadata"
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
