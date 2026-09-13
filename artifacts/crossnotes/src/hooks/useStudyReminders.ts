/**
 * On-device study reminders (free, no server, no push provider).
 *
 * Delivery has two layers:
 *   1. In-page scheduler (reliable) — while the app is open, a setTimeout fires
 *      the reminder at the chosen daily time. This is the path we count on.
 *   2. Periodic Background Sync (best-effort) — for installed PWAs, the service
 *      worker (public/sw.js) can fire even when the app is closed. The browser
 *      decides when it runs, so it may miss the exact time; the tag de-dupes it
 *      against the in-page reminder so the student never sees two.
 *
 * Settings persist to localStorage (window scheduler) and are mirrored into a
 * Cache entry the service worker can read (background scheduler).
 *
 * FUTURE: swap the delivery behind this hook for FCM + a scheduled Cloud
 * Function (functions/src/index.ts, project crossnotes-6767, region
 * asia-south1) for guaranteed delivery. The public interface — enable /
 * disable / updateTime / sendTest — stays identical; only delivery changes.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'cn.reminder';
const CONFIG_CACHE = 'crossnotes-config'; // keep in sync with public/sw.js
const CONFIG_URL = '/__cn_reminder__'; //     keep in sync with public/sw.js
const REMINDER_TAG = 'cn-study-reminder'; //  keep in sync with public/sw.js
const DEFAULT_TIME = '18:00';
const REMINDER_TITLE = 'Time to study 📚';
const REMINDER_BODY = 'Mew says: keep your streak alive 🔥 A few minutes now keeps you on track.';

export type ReminderPermission = NotificationPermission | 'unsupported';

interface StoredConfig {
  enabled: boolean;
  time: string; // "HH:MM", 24-hour
  lastFired?: string; // "YYYY-M-D"
}

const notificationsSupported = typeof window !== 'undefined' && 'Notification' in window;

function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function readConfig(): StoredConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { enabled: false, time: DEFAULT_TIME, ...JSON.parse(raw) };
  } catch {
    /* ignore malformed / unavailable storage */
  }
  return { enabled: false, time: DEFAULT_TIME };
}

function writeConfig(cfg: StoredConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  } catch {
    /* ignore */
  }
}

/** Mirror the settings into a Cache entry the service worker reads on sync. */
async function pushConfigToCache(cfg: StoredConfig) {
  if (typeof caches === 'undefined') return;
  try {
    const cache = await caches.open(CONFIG_CACHE);
    await cache.put(
      CONFIG_URL,
      new Response(JSON.stringify(cfg), { headers: { 'Content-Type': 'application/json' } }),
    );
  } catch {
    /* best-effort */
  }
}

/** ms until the next occurrence of HH:MM — today if still ahead, else tomorrow. */
function msUntil(time: string): number {
  const [h, m] = time.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(h || 0, m || 0, 0, 0);
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
  return target.getTime() - now.getTime();
}

function showReminder() {
  const options: NotificationOptions = {
    body: REMINDER_BODY,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: REMINDER_TAG,
    data: { url: '/' },
  };
  // Android Chrome forbids `new Notification()`; the SW registration is also
  // more reliable when the tab is backgrounded, so prefer it.
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((reg) => reg.showNotification(REMINDER_TITLE, options))
      .catch(() => {
        try {
          new Notification(REMINDER_TITLE, options);
        } catch {
          /* ignore */
        }
      });
  } else {
    try {
      new Notification(REMINDER_TITLE, options);
    } catch {
      /* ignore */
    }
  }
}

async function registerPeriodicSync() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = (await navigator.serviceWorker.ready) as ServiceWorkerRegistration & {
      periodicSync?: { register: (tag: string, opts: { minInterval: number }) => Promise<void> };
    };
    if (!reg.periodicSync) return;
    try {
      const status = await (navigator.permissions as Permissions).query({
        name: 'periodic-background-sync' as PermissionName,
      });
      if (status.state === 'denied') return;
    } catch {
      /* permission not queryable here; try registering anyway */
    }
    await reg.periodicSync.register(REMINDER_TAG, { minInterval: 24 * 60 * 60 * 1000 });
  } catch {
    /* best-effort */
  }
}

async function unregisterPeriodicSync() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = (await navigator.serviceWorker.ready) as ServiceWorkerRegistration & {
      periodicSync?: { unregister: (tag: string) => Promise<void> };
    };
    if (reg.periodicSync) await reg.periodicSync.unregister(REMINDER_TAG);
  } catch {
    /* best-effort */
  }
}

export function useStudyReminders() {
  const [permission, setPermission] = useState<ReminderPermission>(
    notificationsSupported ? Notification.permission : 'unsupported',
  );
  const [config, setConfig] = useState<StoredConfig>(() =>
    notificationsSupported ? readConfig() : { enabled: false, time: DEFAULT_TIME },
  );
  const timerRef = useRef<number | null>(null);

  const active = notificationsSupported && permission === 'granted' && config.enabled;

  // (Re)arm the in-page timeout whenever the active schedule changes.
  useEffect(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!active) return;

    let cancelled = false;
    const arm = () => {
      timerRef.current = window.setTimeout(() => {
        if (cancelled) return;
        showReminder();
        const next = { ...readConfig(), lastFired: todayKey() };
        writeConfig(next);
        pushConfigToCache(next);
        arm(); // schedule the following day
      }, msUntil(config.time));
    };
    arm();

    return () => {
      cancelled = true;
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, [active, config.time]);

  const enable = useCallback(async (time?: string): Promise<ReminderPermission> => {
    if (!notificationsSupported) return 'unsupported';
    let perm = Notification.permission;
    if (perm === 'default') perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm !== 'granted') return perm;

    const next: StoredConfig = { ...readConfig(), enabled: true, time: time || readConfig().time || DEFAULT_TIME };
    writeConfig(next);
    setConfig(next);
    await pushConfigToCache(next);
    await registerPeriodicSync();
    return perm;
  }, []);

  const disable = useCallback(async () => {
    const next: StoredConfig = { ...readConfig(), enabled: false };
    writeConfig(next);
    setConfig(next);
    await pushConfigToCache(next);
    await unregisterPeriodicSync();
  }, []);

  const updateTime = useCallback(async (time: string) => {
    const next: StoredConfig = { ...readConfig(), time };
    writeConfig(next);
    setConfig(next);
    await pushConfigToCache(next);
  }, []);

  const sendTest = useCallback(async (): Promise<ReminderPermission> => {
    if (!notificationsSupported) return 'unsupported';
    let perm = Notification.permission;
    if (perm === 'default') perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm !== 'granted') return perm;
    showReminder();
    return perm;
  }, []);

  return {
    supported: notificationsSupported,
    permission,
    enabled: config.enabled,
    time: config.time,
    active,
    enable,
    disable,
    updateTime,
    sendTest,
  };
}
