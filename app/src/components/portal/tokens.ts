import type { PortalNavId } from "../../lib/portal/types";
import { portalNavMeta } from "../../lib/portal/modules";

/** ELSIAA portal design tokens — shared by shell + sign-in. */
export const portalFonts = {
  mono: {
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif",
  },
  sans: {
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif",
  },
} as const;

/** Default full nav (module access may filter at runtime). */
export const portalNav: Array<{
  id: PortalNavId;
  label: string;
  blurb: string;
}> = (
  [
    "overview",
    "projects",
    "authorizations",
    "files",
    "messages",
    "meetings",
    "billing",
    "users",
    "logs",
    "support",
    "signatures",
  ] as PortalNavId[]
).map((id) => ({ id, ...portalNavMeta[id] }));
