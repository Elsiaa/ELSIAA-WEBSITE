/**
 * Official ELSIAA social profiles — one source of truth.
 *
 * Used by the footer links and by the Organization `sameAs` in the JSON-LD,
 * so a profile can never appear in one and not the other.
 *
 * URLs are stored clean. The Instagram link was shared as
 *   .../elsiaa_ai?igsh=…&utm_source=qr
 * and those params are dropped on purpose: `igsh` identifies the specific
 * share/scan that produced the link and `utm_source=qr` would mis-attribute
 * every visitor arriving from the website as a QR scan.
 */
export const INSTAGRAM_URL = "https://www.instagram.com/elsiaa_ai";

/** Every verified profile, in the order they should be listed. */
export const SOCIAL_PROFILES: Array<{ name: string; handle: string; url: string }> = [
  { name: "Instagram", handle: "@elsiaa_ai", url: INSTAGRAM_URL },
];
