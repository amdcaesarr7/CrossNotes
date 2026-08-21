/**
 * Best-effort browser notifications and local re-engagement helpers.
 *
 * Everything here is intentionally browser-local. CrossNotes can notice when
 * its own tab is hidden or when a learner returns after time away, but it does
 * not inspect other tabs, apps, or browsing history. Full closed-app push
 * notifications would require a push server and are outside this client-only
 * implementation.
 */

const REMINDER_HOUR = 18; // 6pm local time
const PREF_KEY = 'cn-notify-enabled';
const SHOWN_KEY_PREFIX = 'cn-reminder-shown-';
const LAST_ACTIVE_KEY = 'cn-last-active-at';
const LAST_MEW_NUDGE_KEY = 'cn-last-mew-browser-nudge-at';
const MEW_BROWSER_NUDGE_COOLDOWN_MS = 2 * 60 * 60 * 1000;

export type MewNudgeReason = 'social-detour' | 'long-absence';

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getReminderPreference(): boolean {
  try {
    return localStorage.getItem(PREF_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setReminderPreference(value: boolean) {
  try {
    localStorage.setItem(PREF_KEY, value ? 'true' : 'false');
  } catch {
    /* ignore — the preference simply will not persist */
  }
}

export async function requestReminderPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  try {
    if (Notification.permission === 'granted') {
      setReminderPreference(true);
      return true;
    }
    if (Notification.permission === 'denied') return false;
    const permission = await Notification.requestPermission();
    const granted = permission === 'granted';
    setReminderPreference(granted);
    return granted;
  } catch {
    return false;
  }
}

export function getLastActiveAt(): number | null {
  try {
    const value = Number(localStorage.getItem(LAST_ACTIVE_KEY));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

export function markCrossNotesActive(timestamp = Date.now()) {
  try {
    localStorage.setItem(LAST_ACTIVE_KEY, String(timestamp));
  } catch {
    /* activity tracking is enhancement-only */
  }
}

function todayKey(): string {
  const date = new Date();
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/** Fires a single evening streak reminder per day while the app remains open. */
export function maybeShowStudyReminder(studiedToday: boolean) {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== 'granted') return;
  if (!getReminderPreference()) return;
  if (studiedToday) return;
  if (new Date().getHours() < REMINDER_HOUR) return;

  const key = SHOWN_KEY_PREFIX + todayKey();
  try {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
  } catch {
    /* if storage is unavailable, proceed anyway — this is non-critical */
  }

  try {
    new Notification('Mew is protecting your streak.', {
      body: "It is getting late and today’s study session is still theoretical. Two minutes counts.",
      tag: 'cn-streak-reminder',
    });
  } catch {
    /* browser notifications are best-effort only */
  }
}

/**
 * Sends a consent-based browser notification for time away from CrossNotes.
 * The caller decides when a return/away event happened; this helper only
 * checks the user’s notification preference and applies a modest cooldown.
 */
export function maybeShowMewAwayNotification(reason: MewNudgeReason) {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== 'granted' || !getReminderPreference()) return;

  try {
    const lastShown = Number(localStorage.getItem(LAST_MEW_NUDGE_KEY) ?? '0');
    if (Date.now() - lastShown < MEW_BROWSER_NUDGE_COOLDOWN_MS) return;
    localStorage.setItem(LAST_MEW_NUDGE_KEY, String(Date.now()));
  } catch {
    /* a notification without cooldown is still preferable to breaking the app */
  }

  const copy = reason === 'long-absence'
    ? {
        title: 'Mew noticed a suspiciously long break.',
        body: 'No drama. Pick one tiny chapter and make your future self less dramatic.',
      }
    : {
        title: 'Mew noticed CrossNotes went quiet.',
        body: 'If that was a scroll detour, your notes are bravely waiting where you left them.',
      };

  try {
    new Notification(copy.title, {
      body: copy.body,
      tag: `cn-mew-${reason}`,
    });
  } catch {
    /* browser notifications are best-effort only */
  }
}
