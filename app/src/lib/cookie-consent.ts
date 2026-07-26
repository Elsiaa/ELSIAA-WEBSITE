export type CookieConsentChoice = 'accepted' | 'declined';

const STORAGE_KEY = 'cookie_consent';
export const COOKIE_CONSENT_EVENT = 'cookie-consent-change';

export function getCookieConsent(): CookieConsentChoice | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === 'accepted' || value === 'declined') return value;
  } catch {
    /* localStorage unavailable */
  }
  return null;
}

export function hasAnalyticsConsent(): boolean {
  if (process.env.NEXT_PUBLIC_FULLSTORY_GRANT_CONSENT === '1') return true;
  return getCookieConsent() === 'accepted';
}

export function setCookieConsent(choice: CookieConsentChoice): void {
  try {
    localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    /* localStorage unavailable */
  }
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: choice }));
}
