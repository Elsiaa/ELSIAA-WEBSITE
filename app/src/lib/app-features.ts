/**
 * Product feature flags returned on extension/project auth (config) responses.
 *
 * Open-ended: any string key → boolean. No fixed allowlist.
 * Merge order: platform defaults → project overrides → device overrides.
 */

export type AppFeatures = Record<string, boolean>;

/** @deprecated Alias — features are a free-form map. */
export type AppFeaturesPartial = AppFeatures;

/**
 * Platform-wide defaults applied under project/user maps.
 * Empty by default — set keys here (or later via admin) for global baseline.
 */
export const DEFAULT_APP_FEATURES: AppFeatures = {};

/** Example keys shown as quick-add chips in admin UI (not enforced by the API). */
export const EXAMPLE_APP_FEATURE_KEYS = ["concurrences", "bcbaReports", "rbtReports"] as const;

const FEATURE_KEY_RE = /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/;

export function isValidAppFeatureKey(key: string): boolean {
  return FEATURE_KEY_RE.test(key);
}

/** Title-case / split camelCase for display. */
export function formatAppFeatureLabel(key: string): string {
  const spaced = key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim();
  if (!spaced) return key;
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * Parse a loose object into a feature map.
 * Keeps every valid string key; coerces values to boolean.
 * Returns null if input is not an object (except null → null for “clear”).
 */
export function parseAppFeaturesPartial(input: unknown): AppFeatures | null {
  if (input === null) return null;
  if (input === undefined) return {};
  if (typeof input !== "object" || Array.isArray(input)) return null;

  const out: AppFeatures = {};
  for (const [rawKey, value] of Object.entries(input as Record<string, unknown>)) {
    const key = rawKey.trim();
    if (!isValidAppFeatureKey(key)) continue;
    out[key] = Boolean(value);
  }
  return out;
}

/** Clean a map for storage (valid keys only). Does not inject platform defaults. */
export function normalizeAppFeatures(partial: AppFeatures | null | undefined): AppFeatures {
  if (!partial) return {};
  const parsed = parseAppFeaturesPartial(partial);
  return parsed ?? {};
}

/**
 * Resolve effective features for a client.
 * Later layers override earlier ones for shared keys; new keys are additive.
 */
export function resolveAppFeatures(options: {
  projectFeatures?: AppFeatures | null;
  deviceFeatures?: AppFeatures | null;
  defaults?: AppFeatures;
}): AppFeatures {
  const base = options.defaults ?? DEFAULT_APP_FEATURES;
  return {
    ...base,
    ...(options.projectFeatures ?? {}),
    ...(options.deviceFeatures ?? {}),
  };
}

/** Sorted unique keys across several maps (stable admin UI order). */
export function collectAppFeatureKeys(...maps: Array<AppFeatures | null | undefined>): string[] {
  const keys = new Set<string>();
  for (const map of maps) {
    if (!map) continue;
    for (const key of Object.keys(map)) {
      if (isValidAppFeatureKey(key)) keys.add(key);
    }
  }
  return [...keys].sort((a, b) => a.localeCompare(b));
}
