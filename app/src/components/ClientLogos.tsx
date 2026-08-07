/*
  Client logo marquee — one implementation, used by /designs and /why-elsiaa.

  On the source art: every file in /assets/logos is MONOCHROME. Sampling each
  PNG composited over white at 256x256 and reducing to a 16x16 grid gives a
  maximum channel spread of 0 across all nine — R, G and B are identical in
  every cell, so there is no colour in the assets to show. They render at full
  strength here (the previous marquee dimmed them to 90% opacity, which only
  made them washed out). Swapping in the clients' real colour logos is a
  drop-in change: replace the files and clear `mono` below.

  On sizing: the artwork ranges from 900x88 (Dialog, ~10:1) to 185x160
  (Beyond Autism, ~1.2:1). A single height would make the wide wordmarks
  enormous, so each logo carries its own optical height, capped by a shared
  max width so no one mark dominates the band.
*/

type Logo = {
  src: string;
  alt: string;
  /** optical height in px — tuned per mark, not derived from the file */
  h: number;
};

const LOGOS: Logo[] = [
  { src: "/assets/logos/mr_bins.png", alt: "Mr. Bins", h: 50 },
  { src: "/assets/logos/dialog_healthcare.png", alt: "Dialog Healthcare", h: 34 },
  { src: "/assets/logos/first_medcare.png", alt: "First Medcare Inc", h: 56 },
  { src: "/assets/logos/excelsior.png", alt: "Excelsior Healthcare Solutions", h: 44 },
  { src: "/assets/logos/hiddenlight.png", alt: "HiddenLight ABA", h: 44 },
  { src: "/assets/logos/beyond_autism.png", alt: "Beyond Autism Services", h: 72 },
  { src: "/assets/logos/kore_autism.png", alt: "Kore Autism Services", h: 56 },
  { src: "/assets/logos/hidden_talents.png", alt: "Hidden Talents ABA", h: 56 },
  { src: "/assets/logos/diet_fantasy.png", alt: "The Diet Fantasy", h: 56 },
];

/** Widest a single mark may render, so the wide wordmarks can't dominate. */
const MAX_W = 220;

function Mark({ l, hidden }: { l: Logo; hidden?: boolean }) {
  return (
    <div
      className="flex flex-none items-center justify-center"
      style={{ height: l.h, maxWidth: MAX_W }}
      {...(hidden ? { "aria-hidden": true } : {})}
    >
      <img
        src={l.src}
        alt={hidden ? "" : l.alt}
        loading="lazy"
        /* height and max-width are inline because styles.css sets an unlayered
           `img { max-width: 100% }`, which outranks every Tailwind utility
           layer and would make a max-w-* class inert here. */
        style={{ height: "100%", width: "auto", maxWidth: MAX_W }}
        className="object-contain transition-transform duration-300 hover:-translate-y-1"
      />
    </div>
  );
}

export function ClientLogos({
  /** Colour the edge fades blend into — must match the section background. */
  fade = "#ffffff",
  className = "",
}: {
  fade?: string;
  className?: string;
}) {
  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      <style>{`
        @keyframes elsiaa-logo-marquee { from { transform: translate3d(0,0,0); } to { transform: translate3d(-50%,0,0); } }
        .elsiaa-logo-track { animation: elsiaa-logo-marquee 46s linear infinite; }
        /* Constant autoplay, including on hover — the band is decorative and
           never stops. Motion-sensitive visitors get a static wrap instead. */
        @media (prefers-reduced-motion: reduce) {
          .elsiaa-logo-track { animation: none; width: 100%; flex-wrap: wrap; justify-content: center; }
          .elsiaa-logo-track > [data-dup="1"] { display: none; }
        }
      `}</style>

      {/* Edge fades. Inline gradients so the colour can follow the section. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 md:w-28"
        style={{ background: `linear-gradient(to right, ${fade}, ${fade}00)` }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 md:w-28"
        style={{ background: `linear-gradient(to left, ${fade}, ${fade}00)` }}
      />

      {/* The track is exactly two identical copies, so translating it -50%
          lands on a pixel-identical frame and the loop has no seam. */}
      <div className="elsiaa-logo-track flex w-max items-center gap-14 md:gap-20">
        {LOGOS.map((l) => (
          <Mark key={l.src} l={l} />
        ))}
        {LOGOS.map((l) => (
          <div key={`dup-${l.src}`} data-dup="1" className="flex flex-none">
            <Mark l={l} hidden />
          </div>
        ))}
      </div>
    </div>
  );
}
