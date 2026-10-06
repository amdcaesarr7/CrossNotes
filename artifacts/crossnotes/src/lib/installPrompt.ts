/**
 * PWA install prompt helpers + soft-prompt scheduling.
 *
 * Soft prompt shows after a real study action (see celebrate.ts), not on first paint.
 * Dismiss cools down for 14 days. Tour must be finished/skipped first.
 */

export const TOUR_COMPLETE_KEY = 'cn-first-use-tour-complete';
export const INSTALL_DISMISS_UNTIL_KEY = 'cn-install-dismiss-until';
export const INSTALL_SOFT_SESSION_KEY = 'cn-install-soft-session';
export const STUDY_COMPLETE_EVENT = 'cn-study-complete';

/** 14 days — respect “Not now” without nagging every reload. */
export const INSTALL_DISMISS_MS = 14 * 24 * 60 * 60 * 1000;

export function isTourComplete(): boolean {
  try {
    return localStorage.getItem(TOUR_COMPLETE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function isInstallDismissed(): boolean {
  try {
    const raw = localStorage.getItem(INSTALL_DISMISS_UNTIL_KEY);
    if (!raw) return false;
    const until = Number(raw);
    if (!Number.isFinite(until)) return false;
    return Date.now() < until;
  } catch {
    return false;
  }
}

export function dismissInstallPrompt(ms: number = INSTALL_DISMISS_MS) {
  try {
    localStorage.setItem(INSTALL_DISMISS_UNTIL_KEY, String(Date.now() + ms));
  } catch {
    /* ignore */
  }
  try {
    sessionStorage.setItem(INSTALL_SOFT_SESSION_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function markInstallSoftShownThisSession() {
  try {
    sessionStorage.setItem(INSTALL_SOFT_SESSION_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function wasInstallSoftShownThisSession(): boolean {
  try {
    return sessionStorage.getItem(INSTALL_SOFT_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

/** Fire after notes / flashcards / quiz completion so the soft sheet can appear. */
export function signalStudyComplete() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(STUDY_COMPLETE_EVENT));
}

export function canOfferInstallSoftPrompt(installed: boolean): boolean {
  if (installed) return false;
  if (!isTourComplete()) return false;
  if (isInstallDismissed()) return false;
  if (wasInstallSoftShownThisSession()) return false;
  return true;
}
