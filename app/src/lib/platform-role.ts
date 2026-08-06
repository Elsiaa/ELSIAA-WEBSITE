/**
 * Normalize platform_role comparisons (DB or legacy rows may differ in casing).
 */
export function isPlatformSupportAgent(platformRole: string | null | undefined): boolean {
  const s = String(platformRole ?? "")
    .trim()
    .toLowerCase();
  return s === "support_agent";
}
