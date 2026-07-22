/**
 * Best-effort study reminders using the browser Notification API.
 *
 * LIMITATION, on purpose: these only fire while the app is open (foreground
 * or a backgrounded tab) — a fully-closed-app push notification needs a
 * service worker plus a push server (e.g. Firebase Cloud Messaging) to wake
 * the browser, which is separate backend infrastructure this static app
 * doesn't have. This gives you the "your streak is at risk" nudge for anyone
 * who has the tab open in the evening; true push is a follow-up feature.
 */

const REMINDER_HOUR = 18; // 6pm local time
const PREF_KEY = "cn-notify-enabled";
const SHOWN_KEY_PREFIX = "cn-reminder-shown-";

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getReminderPreference(): boolean {
  try {
    return localStorage.getItem(PREF_KEY) === "true";
  } catch {
    return false;
  }
}

export function setReminderPreference(v: boolean) {
  try {
    localStorage.setItem(PREF_KEY, v ? "true" : "false");
  } catch {
    /* ignore — worst case the toggle doesn't persist */
  }
}

export async function requestReminderPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  try {
    if (Notification.permission === "granted") {
      setReminderPreference(true);
      return true;
    }
    if (Notification.permission === "denied") return false;
    const perm = await Notification.requestPermission();
    const granted = perm === "granted";
    setReminderPreference(granted);
    return granted;
  } catch {
    return false;
  }
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Call periodically while the app is open. No-ops unless the user opted in,
 *  granted permission, it's evening, and they haven't studied yet today. */
export function maybeShowStudyReminder(studiedToday: boolean) {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== "granted") return;
  if (!getReminderPreference()) return;
  if (studiedToday) return;
  if (new Date().getHours() < REMINDER_HOUR) return;

  const key = SHOWN_KEY_PREFIX + todayKey();
  try {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
  } catch {
    /* if storage isn't available, proceed anyway — not critical */
  }

  try {
    new Notification("🔥 Keep your streak alive!", {
      body: "You haven't studied today yet. A quick quiz takes 2 minutes.",
      tag: "cn-streak-reminder",
    });
  } catch {
    /* best-effort only */
  }
}
