/*
  ELSIAA lion mark — a geometric, low-poly lion head in profile.
  Faceted line-art with a single emerald eye, matching the brand logo.
  Strokes/fills use currentColor so the mark inverts (ink on light, white
  on the dark menu overlay); the eye stays emerald. Scalable, crisp at any size.
*/
export function LionMark({ className = "", title = "ELSIAA" }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 96 96"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinejoin="round"
      strokeLinecap="round"
      role="img"
      aria-label={title}
    >
      {/* outer mane + head silhouette (facing left) */}
      <path d="M20 64 L28 52 L34 46 L40 36 L46 27 L43 18 L58 12 L74 16 L86 30 L88 50 L82 66 L72 79 L59 84 L47 78 L33 74 L24 69 Z" />
      {/* muzzle + nose */}
      <path d="M28 52 L39 55 M39 55 L34 46 M20 64 L28 58 L34 46 M39 55 L33 63" />
      {/* internal facets — low-poly mane + face */}
      <path d="M46 27 L60 34 L74 16 M60 34 L86 30 M60 34 L88 50 M60 34 L40 36 M60 34 L58 56 L39 55 M58 56 L82 66 M58 56 L47 78" />
      {/* solid facets for depth */}
      <path d="M58 12 L74 16 L60 34 Z" fill="currentColor" stroke="none" />
      <path d="M58 56 L82 66 L72 79 Z" fill="currentColor" stroke="none" />
      <path d="M43 18 L58 12 L46 27 Z" fill="currentColor" stroke="none" />
      {/* emerald eye */}
      <path d="M34 44 L40 41 L42 45 L37 47 Z" fill="#2e9e58" stroke="none" />
    </svg>
  );
}
