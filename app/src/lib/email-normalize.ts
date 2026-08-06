/**
 * Normalize email for auth lookups: trim, lowercase, remove whitespace (handles accidental spaces in the address).
 */
export function normalizeEmailForAuth(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .normalize("NFKC")
    .replace(/[\s\u00A0\u2000-\u200B\u202F\u205F\u3000\uFEFF]+/g, "")
    .toLowerCase();
}
