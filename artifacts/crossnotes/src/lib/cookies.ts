export type CookieConsent = {
  necessary: true;
  preferences: boolean;
};

const CONSENT_COOKIE = 'crossnotes-cookie-consent';
const CONSENT_EVENT = 'crossnotes:open-cookie-preferences';
const MAX_AGE = 60 * 60 * 24 * 180;

function canUseCookies() {
  return typeof document !== 'undefined';
}

export function readCookieConsent(): CookieConsent | null {
  if (!canUseCookies()) return null;
  const value = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(`${CONSENT_COOKIE}=`))
    ?.slice(CONSENT_COOKIE.length + 1);
  if (!value) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as Partial<CookieConsent>;
    return parsed.necessary === true
      ? { necessary: true, preferences: parsed.preferences === true }
      : null;
  } catch {
    return null;
  }
}

export function saveCookieConsent(preferences: boolean) {
  if (!canUseCookies()) return;
  const value = encodeURIComponent(JSON.stringify({ necessary: true, preferences }));
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CONSENT_COOKIE}=${value}; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax${secure}`;
}

export function openCookiePreferences() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT));
  }
}

export function onCookiePreferencesRequest(handler: () => void) {
  window.addEventListener(CONSENT_EVENT, handler);
  return () => window.removeEventListener(CONSENT_EVENT, handler);
}
