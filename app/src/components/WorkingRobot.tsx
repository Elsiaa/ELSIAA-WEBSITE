import { useEffect, useRef } from "react";

/*
  Automation division graphic — the multitasking robot, white studio.
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
    <div className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl bg-white">
      <video
        ref={ref}
        src="/assets/robot_work_v1.mp4"
        loop
        muted
        playsInline
        preload="metadata"
        poster="/assets/robot_work_poster.jpg"
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  );
}
