/**
 * Operational UI tokens for portal billing / admin billing.
 * ELSIAA green (not Poel flame orange) so old Poel users still recognize
 * the layout, but branding matches ELSIAA.
 */
export const ops = {
  /** Primary accent — ELSIAA green */
  flame: "#1e6b3c",
  coral: "#2e9e58",
  ember: "#155a32",
  navy: "#111111",
  abyss: "#0c0c0c",
  steel: "#2a2a2a",
  slate: "#555555",
  mist: "#d4d4d4",
  offWhite: "#f5f5f3",
  white: "#ffffff",
  successBg: "#ecfdf5",
  successFg: "#166534",
  dangerBg: "#fef2f2",
  dangerFg: "#991b1b",
} as const;

export const opsFonts = {
  sans: {
    fontFamily:
      "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif",
  },
} as const;
