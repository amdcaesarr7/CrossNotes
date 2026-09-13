// CrossNotes service worker — offline study support.
//
// Two independent caches, on purpose, with different strategies:
//
//   APP_CACHE    the app shell + every hashed build asset (JS/CSS chunks,
//                including the lazily-imported subject / quiz / flashcard
//                content) + the brand icons. Auto-populated as the student
//                uses the app, so any subject they have opened once works
//                fully offline. Wiped when APP_VERSION is bumped.
//
//   VAULT_CACHE  the ~115 MB of Vault PDFs / PPTX. NEVER auto-cached — a
//                student on mobile data must not silently lose 115 MB of
//                storage. Populated only when they tap "Save offline" on a
//                Vault entry (the window writes here via the Cache API in
//                src/lib/offlineVault.ts; this SW only *serves* it). Survives
//                app-version bumps so saved files aren't wiped on every deploy.
//
// Keep in sync: the VAULT_CACHE name here must equal the one in
// src/lib/offlineVault.ts.

const APP_VERSION = 'v2';
const APP_CACHE = `crossnotes-app-${APP_VERSION}`;
const VAULT_CACHE = 'crossnotes-vault-v1';
// Tiny store for the study-reminder settings, shared with the window
// (src/hooks/useStudyReminders.ts). Read on periodicsync so a reminder can
// fire even when the app isn't open. Kept out of the version-bumped app cache
// so settings survive updates.
const CONFIG_CACHE = 'crossnotes-config';
const REMINDER_KEY = '/__cn_reminder__';
const REMINDER_TAG = 'cn-study-reminder';

// A tiny, always-present shell so the app boots with no network at all.
const APP_SHELL = [
  '/',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(APP_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            // Keep the current app cache, the vault cache (saved PDFs must
            // survive an app update), and the reminder-settings cache; delete
            // everything else (old app versions).
            .filter((key) => key !== APP_CACHE && key !== VAULT_CACHE && key !== CONFIG_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Immutable hashed assets: serve from cache, only hit the network on a miss.
function cacheFirst(request) {
  return caches.open(APP_CACHE).then((cache) =>
    cache.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response && response.ok) cache.put(request, response.clone());
        return response;
      });
    }),
  );
}

// Everything else same-origin: return cache immediately if present, but also
// refresh it in the background so a reconnect quietly picks up new content.
function staleWhileRevalidate(request) {
  return caches.open(APP_CACHE).then((cache) =>
    cache.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only same-origin GETs. Google Fonts, Firestore, Google Auth, etc. pass
  // straight through to the network untouched.
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // SPA navigations: network-first for fresh HTML after a deploy, falling back
  // to the cached shell so deep links (e.g. /quiz/science-1/ch1) open offline.
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/')));
    return;
  }

  // Vault files: serve ONLY if the student explicitly saved them. Never store
  // on a normal fetch — that is the whole point of opt-in offline for 115 MB.
  if (url.pathname.startsWith('/vault/')) {
    event.respondWith(
      caches
        .open(VAULT_CACHE)
        .then((cache) => cache.match(request))
        .then((cached) => cached || fetch(request)),
    );
    return;
  }

  // Hashed build output is content-addressed and immutable → cache-first.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Icons, manifest, other root-level files.
  event.respondWith(staleWhileRevalidate(request));
});

// ─── Study reminders ────────────────────────────────────────────────────────
// On-device daily reminder. The reliable path is the in-page scheduler in
// src/hooks/useStudyReminders.ts; this Periodic Background Sync handler is a
// best-effort bonus for installed PWAs, letting a reminder fire when the app
// isn't open. The browser picks when periodicsync runs, so we can only fire if
// that happens to land after the user's chosen time — hence "best-effort".
//
// FUTURE: swap to FCM + a scheduled Cloud Function (functions/src/index.ts,
// project crossnotes-6767, region asia-south1) for guaranteed server-side
// delivery even when the app has never been opened that day.

const REMINDER_TITLE = 'Time to study 📚';
const REMINDER_BODY = 'Mew says: keep your streak alive 🔥 A few minutes now keeps you on track.';

function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

async function maybeFireReminder() {
  try {
    const cache = await caches.open(CONFIG_CACHE);
    const res = await cache.match(REMINDER_KEY);
    if (!res) return;
    const cfg = await res.json();
    if (!cfg || !cfg.enabled || !cfg.time) return;

    const now = new Date();
    const key = todayKey(now);
    if (cfg.lastFired === key) return; // already reminded today

    const [h, m] = String(cfg.time).split(':').map(Number);
    const target = new Date();
    target.setHours(h || 0, m || 0, 0, 0);
    if (now.getTime() < target.getTime()) return; // not time yet

    await self.registration.showNotification(REMINDER_TITLE, {
      body: REMINDER_BODY,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: REMINDER_TAG, // same tag de-dupes against the in-page reminder
      data: { url: '/' },
    });

    cfg.lastFired = key;
    await cache.put(
      REMINDER_KEY,
      new Response(JSON.stringify(cfg), { headers: { 'Content-Type': 'application/json' } }),
    );
  } catch {
    // best-effort; never throw out of a sync event
  }
}

self.addEventListener('periodicsync', (event) => {
  if (event.tag === REMINDER_TAG) event.waitUntil(maybeFireReminder());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client) client.navigate(targetUrl).catch(() => {});
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
      return undefined;
    }),
  );
});
