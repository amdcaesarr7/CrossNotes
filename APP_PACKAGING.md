# Packaging CrossNotes as an app — for ₹0

CrossNotes is a **Progressive Web App (PWA)**. That means it can be installed as
a real app — home-screen icon, full-screen (no browser bars), offline study,
daily reminders — **without the Google Play Store and without paying anyone**.

There are two ways students get "the app". Both are free.

- **A. Install straight from the browser** (no file to share, works today).
- **B. A shareable `.apk` file** built with PWABuilder (great for WhatsApp).

Live app URL used for packaging:

```
https://cross-notes-crossnotes-i2u7.vercel.app/
```

> Prerequisite: deploy the current build to Vercel first. The `.apk` is a thin
> wrapper around the **live** site, so the icon, offline support and manifest
> that make it a good app must already be live. After `pnpm build`, push to the
> branch Vercel deploys, or run `vercel --prod`.

---

## A. Install from the browser (fastest, nothing to share)

**Android (Chrome / Edge / Brave):**
1. Open the live URL.
2. The in-app Mew install prompt appears — tap **Install**. (Or use the browser
   menu ⋮ → **Install app** / **Add to Home screen**.)
3. CrossNotes lands on the home screen with the Mew icon and opens full-screen.

**iPhone / iPad (Safari — Apple only allows install from Safari):**
1. Open the live URL in **Safari**.
2. Tap the **Share** button → **Add to Home Screen** → **Add**.
3. It appears with the Mew icon and opens full-screen.

That's it — this is a genuine installed app. Offline study and on-device
reminders both work from here. Sharing is just sharing the link.

---

## B. Build a shareable `.apk` with PWABuilder (free, no Play Store)

Use this when you want a single file to send over WhatsApp / Telegram / a
download link that people install like any other app.

PWABuilder wraps the live PWA in a **Trusted Web Activity (TWA)** and hands you
a **signed APK**. No Android Studio, no Java, no ₹2,000 Play Store fee.

### Steps

1. Go to **https://www.pwabuilder.com**.
2. Paste the live URL and click **Start**. PWABuilder scores the
   Manifest, Service Worker and Security. With Phases 1–2 deployed these should
   all pass (real PNG icons + maskable icon, valid manifest, offline SW).
3. Click **Package For Stores** → the **Android** card → **Generate Package**.
4. Fill in the options (sensible defaults shown):
   - **Package ID:** a reverse-domain id, e.g. `app.crossnotes.twa`
     (this is permanent for the app's identity — pick once and keep it).
   - **App name:** `CrossNotes` · **Launcher name:** `CrossNotes`
   - **Signing key:** choose **"Create new"** and let PWABuilder generate one.
     ⚠️ **Download and keep the `.keystore` file and its passwords somewhere
     safe.** You need the exact same key to ship any future update; lose it and
     you must publish under a new package id.
5. Download the ZIP. Inside you get:
   - `app-release-signed.apk` — **the file you share/install.**
   - `app-release.aab` — only needed if you ever go to the Play Store; ignore
     for direct sharing.
   - `signing.keystore` (+ a readme with passwords and the **SHA-256
     fingerprint**) — back this up.
   - `assetlinks.json` — used in the optional step below.

### Optional but recommended: verify the domain (removes the URL bar)

By default a TWA can show a thin address bar at the top. To get a clean,
full-screen app, prove the app and the website belong together:

1. Open the `assetlinks.json` from the ZIP (it contains your app's SHA-256
   fingerprint).
2. Add it to the site so it deploys to
   **`/.well-known/assetlinks.json`**: create
   `artifacts/crossnotes/public/.well-known/assetlinks.json` with that content,
   commit, and redeploy.
3. Confirm it's live at
   `https://cross-notes-crossnotes-i2u7.vercel.app/.well-known/assetlinks.json`.

Next launch of the installed app, the URL bar is gone.

---

## Installing / sharing the `.apk`

**Install on an Android phone:**
1. Copy `app-release-signed.apk` to the phone (WhatsApp, USB, download link…).
2. Tap it. Android will ask to allow installs from this source — enable
   **"Allow from this source" / "Install unknown apps"** for the app you opened
   it from (Files, Chrome, WhatsApp), then tap **Install**.
3. CrossNotes installs with the Mew icon and opens full-screen.

**Share it:**
- Send the `.apk` directly on WhatsApp/Telegram, **or**
- Upload it somewhere (Google Drive, GitHub Release, your own link) and share
  the download URL.

> iPhones can't install `.apk` files — that's an Android format. For iOS,
> route people to **Method A** (Add to Home Screen in Safari).

---

## What students get in the installed app

- **Home-screen icon + full-screen** — looks and launches like a native app.
- **Offline study** — any subject they've opened once (notes, flashcards,
  quizzes) works with no internet. Vault PDFs work offline **after** they tap
  **"Save offline"** on that file (they're big, so it's opt-in).
- **Daily study reminders** — set a time under **Progress → Study reminders**.
  Reliable while the app has been opened that day; installed Android PWAs can
  also fire in the background (best-effort). No account or server needed.

---

## Keeping the app updated

Because both methods wrap the **live URL**, you almost never rebuild the app:

- **Content / feature changes:** just deploy to Vercel. Installed PWAs and the
  APK pick up the new version automatically (the service worker refreshes the
  cache; bump `APP_VERSION` in `public/sw.js` when you want to force old caches
  to clear).
- **Rebuild the APK only** when you change the app id, name, icon, or splash —
  re-run PWABuilder with the **same signing key** you saved.

---

## Alternative: Bubblewrap CLI (only if you install the Android SDK)

PWABuilder uses Google's **Bubblewrap** under the hood. If you ever install the
Android SDK + JDK you can build the same TWA locally:

```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://cross-notes-crossnotes-i2u7.vercel.app/manifest.webmanifest
bubblewrap build   # produces app-release-signed.apk
```

For now PWABuilder is simpler and needs nothing installed on this machine.

---

## The one paid thing we deliberately skipped

Server-pushed reminders (a notification even if the app was never opened that
day) need Firebase Cloud Messaging + a scheduled Cloud Function, which requires
the Firebase **Blaze** plan. The reminder code is structured so that can be
added later without changing the UI — see the `// FUTURE` markers in
`public/sw.js` and `src/hooks/useStudyReminders.ts`. Everything documented above
stays **₹0**.
