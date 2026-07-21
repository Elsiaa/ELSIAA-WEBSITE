import { useEffect, useRef } from "react";

/*
  Design division graphic — the artist at work, white studio.
  A designer sits intently at his desk — headphones on, stylus on iPad,
  Apple desktop mid-layout, easel canvas of brand sketches beside him —
  permanently alive and actively designing on a seamless loop.
  Plays when in view, pauses off-screen. Pure white surface so it sits
  seamlessly on the white page.
*/
export function AssemblingArtist() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(
      (e) => {
        if (e[0].isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.2 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <div className="relative aspect-[3/2] w-full bg-white">
      <video
        ref={ref}
        src="/assets/artist_work_v3.mp4"
        loop
        muted
        playsInline
        preload="metadata"
        poster="/assets/artist_work_poster_v3.jpg"
        className="absolute inset-0 h-full w-full object-contain"
      />
    </div>
  );
}
