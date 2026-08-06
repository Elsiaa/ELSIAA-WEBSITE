import { SOCIAL_PROFILES } from "../lib/social";

/*
  The social buttons, rendered from lib/social.ts in both places they appear —
  the hero band and the footer — so the two can never drift apart. A profile
  without a confirmed URL is filtered out upstream and simply does not render.

  Glyphs are drawn rather than imported: no icon dependency, and they inherit
  the link colour on hover.
*/

function Glyph({ name }: { name: string }) {
  if (name === "LinkedIn") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden className="h-[15px] w-[15px] flex-none" fill="currentColor">
        <path d="M20.4 3H3.6C3 3 3 3 3 3.6v16.8c0 .6 0 .6.6.6h16.8c.6 0 .6 0 .6-.6V3.6c0-.6 0-.6-.6-.6zM8 18H5.5V9.5H8V18zM6.75 8.3a1.45 1.45 0 110-2.9 1.45 1.45 0 010 2.9zM18.5 18H16v-4.3c0-1 0-2.3-1.4-2.3s-1.6 1.1-1.6 2.2V18H10.5V9.5h2.4v1.1h.03c.34-.64 1.16-1.3 2.4-1.3 2.56 0 3.03 1.7 3.03 3.9V18z" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="h-[15px] w-[15px] flex-none"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
    >
      <rect x="3" y="3" width="18" height="18" rx="5.2" />
      <circle cx="12" cy="12" r="4.1" />
      <circle cx="17.2" cy="6.8" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * `labelled` — pill with the handle, for the footer.
 * `icon`     — 40px square, for the hero band where space is tight.
 */
export function SocialLinks({
  variant = "labelled",
  className = "",
}: {
  variant?: "labelled" | "icon";
  className?: string;
}) {
  if (SOCIAL_PROFILES.length === 0) return null;

  const icon = variant === "icon";
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {SOCIAL_PROFILES.map((p) => (
        <a
          key={p.name}
          href={p.url}
          target="_blank"
          rel="me noreferrer"
          aria-label={`ELSIAA on ${p.name} (opens in a new tab)`}
          title={`ELSIAA on ${p.name}`}
          className={
            icon
              ? "inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/[0.12] text-[#111111]/70 transition-all hover:border-[#1e6b3c] hover:text-[#1e6b3c]"
              : "inline-flex min-h-[44px] items-center gap-2 rounded-full border border-black/[0.12] px-4 text-[13px] font-semibold text-[#111111] transition-all hover:border-[#1e6b3c] hover:text-[#1e6b3c]"
          }
          style={icon ? undefined : { fontFamily: "var(--font-sans)" }}
        >
          <Glyph name={p.name} />
          {!icon && p.handle}
        </a>
      ))}
    </div>
  );
}
