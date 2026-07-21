import { useEffect, useRef } from "react";

/*
  Automation division graphic — a team of many-handed robots, white studio.
  One robot doing several human jobs at once, permanently alive:
  typing, writing, phone, headset. Plays when in view, pauses off-screen.
*/
export function WorkingRobot() {
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
        src="/assets/robot_work_v2.mp4"
        loop
        muted
        playsInline
        preload="metadata"
        poster="/assets/robot_work_poster_v2.jpg"
        className="absolute inset-0 h-full w-full object-contain"
      />
    </div>
  );
}
