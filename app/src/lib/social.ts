/**
 * Official ELSIAA social profiles — one source of truth.
 *
 * Feeds the footer links, the hero band, and the Organization `sameAs` in the
 * JSON-LD, so a profile can never appear in one and be missing from another.
 *
 * URLs are stored clean. The Instagram link was shared as
 *   .../elsiaa_ai?igsh=…&utm_source=qr
 * and those params are dropped on purpose: `igsh` identifies the specific
 * share/scan that produced the link and `utm_source=qr` would mis-attribute
 * every visitor arriving from the website as a QR scan.
 */
export const INSTAGRAM_URL = "https://www.instagram.com/elsiaa_ai";

/**
 * TODO — paste the real company page here, e.g.
 *   https://www.linkedin.com/company/elsiaa
 *
 * Leave it empty until it is confirmed. The empty string is the single switch:
 * the button stays hidden and LinkedIn is left out of the structured data, so
 * an unverified URL can never reach a visitor or Google. Fill it in and the
 * button and the sameAs entry both turn on — nothing else to change.
 */
export const LINKEDIN_URL = "";

export type SocialProfile = { name: "Instagram" | "LinkedIn"; handle: string; url: string };

/** Declared profiles, including any still waiting on a URL. */
const DECLARED: SocialProfile[] = [
  { name: "Instagram", handle: "@elsiaa_ai", url: INSTAGRAM_URL },
  { name: "LinkedIn", handle: "ELSIAA", url: LINKEDIN_URL },
];

/** Only profiles with a confirmed URL. Everything renderable reads from this. */
export const SOCIAL_PROFILES: SocialProfile[] = DECLARED.filter((p) => p.url.trim() !== "");

/** Names still waiting on a URL — handy for a build-time check or an audit. */
export const PENDING_PROFILES: string[] = DECLARED.filter((p) => p.url.trim() === "").map(
  (p) => p.name,
);
