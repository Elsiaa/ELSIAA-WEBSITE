/** Persist UI place across soft refreshes (no full page reload). */

const ADMIN_TAB_KEY = "elsiaa_admin_active_tab";
const PORTAL_PLACE_KEY = "elsiaa_portal_place";

export type PortalPlace = {
  projectId?: string | null;
  chat?: string | null;
  chatState?: "closed" | "sidebar" | "expanded" | null;
};

export function readAdminTab(fallback: string): string {
  if (typeof window === "undefined") return fallback;
  try {
    return sessionStorage.getItem(ADMIN_TAB_KEY) || fallback;
  } catch {
    return fallback;
  }
}

export function writeAdminTab(tab: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(ADMIN_TAB_KEY, tab);
  } catch {
    /* ignore quota / private mode */
  }
}

export function readPortalPlace(): PortalPlace | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PORTAL_PLACE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PortalPlace;
  } catch {
    return null;
  }
}

export function writePortalPlace(place: PortalPlace): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(PORTAL_PLACE_KEY, JSON.stringify(place));
  } catch {
    /* ignore */
  }
}
