# CrossNotes

CrossNotes is a free, open-source study companion for Maharashtra State Board (SSC) Class 10 students. It combines chapter-wise notes, flashcards, quizzes, progress tracking, XP, streaks, and a resource vault in one calm revision workspace.

## Live app

**https://crossnotes.rf.gd/**

You can browse the public learning material without an account. Signing in enables synced progress, XP, streaks, coins, and leaderboard participation.

## What is included

- Science 1 and Science 2 revision material
- Maths 1 (Algebra) and Maths 2 (Geometry)
- History and Political Science
- Geography
- Chapter notes with structured explanations
- Flashcards and quizzes with XP rewards
- Progress tracking, streak freezes, and study reminders
- Resource Vault for extra study material
- Optional leaderboard, nickname, and privacy controls
- Responsive PWA experience with light and dark themes

## Technology

- React and TypeScript
- Vite
- Wouter
- Firebase Authentication and Firestore
- Tailwind CSS and custom claymorphic CSS
- Vercel and Firebase-compatible static hosting

The frontend lives in `artifacts/crossnotes`. Workspace-level libraries and supporting services live under `lib`, `functions`, and `scripts`.

## Local development

Requirements: Node.js and pnpm.

```bash
pnpm install
pnpm --filter @workspace/crossnotes dev
```

Useful checks:

```bash
pnpm --filter @workspace/crossnotes typecheck
pnpm --filter @workspace/crossnotes build
```

Create the frontend environment values expected by `artifacts/crossnotes/src/lib/firebase.ts` before testing authentication or Firestore features. The app still renders its public/static content when Firebase is unavailable.

## SEO and accessibility

Public routes define page titles, descriptions, canonical URLs, Open Graph/Twitter metadata, breadcrumbs, and JSON-LD where appropriate. The generated `robots.txt` and `sitemap.xml` are served from `artifacts/crossnotes/public`.

When adding a public route:

1. Add a route-specific `useHead` call.
2. Set a canonical path and breadcrumb schema.
3. Add the URL to `artifacts/crossnotes/public/sitemap.xml` when it is crawlable.
4. Keep interactive controls keyboard accessible and provide meaningful labels.

## Contributing

Open an issue for bugs, content corrections, or feature ideas. Pull requests should explain the user-facing reason for the change and include the smallest relevant validation command. Please do not commit Firebase credentials, personal data, or generated build output.

## Credits

CrossNotes is built by Caesar Anwar with support from the tools and resources listed in the in-app [Credits page](https://crossnotes.rf.gd/credits).
