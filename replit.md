# CrossNotes

Maharashtra Board 10th study app — notes, flashcards, quizzes, XP system and leaderboard, backed by Firebase (Firestore + Google Auth).

## Run & Operate

- `pnpm --filter @workspace/crossnotes run dev` — run the CrossNotes frontend (managed via workflow)
- `pnpm --filter @workspace/api-server run dev` — run the API server (managed via workflow; currently health-check only)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages (mockup-sandbox excluded)
- Required env at **runtime** only (not build time): `VITE_FIREBASE_*` — six Firebase config vars (see `artifacts/crossnotes/.env.example`)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite 7, Tailwind CSS v4, wouter router
- Backend data: Firebase Firestore (subjects, chapters, notes, flashcards, quiz, progress, leaderboard)
- Auth: Firebase Google Auth
- Static content: bundled JSON files in `artifacts/crossnotes/src/data/content/{slug}.json`
- API server: Express 5 (health-check stub — not used by the frontend)

## Where things live

- `artifacts/crossnotes/src/pages/` — Dashboard, Home, Subject, Notes, Flashcards, Quiz, Progress, Leaderboard
- `artifacts/crossnotes/src/hooks/useFirestore.ts` — all Firestore read hooks + XP write helpers
- `artifacts/crossnotes/src/hooks/useContent.ts` — static JSON content hooks (no Firestore)
- `artifacts/crossnotes/src/data/content/` — per-subject JSON files (chapters, notes, flashcards, quiz)
- `artifacts/crossnotes/src/data/subjects.ts` — subject metadata list
- `artifacts/crossnotes/src/lib/firebase.ts` — Firebase init (graceful if env vars absent)
- `artifacts/crossnotes/src/contexts/AuthContext.tsx` — Google Auth context
- `artifacts/crossnotes/.env.example` — Firebase env var template + Firestore rules

## Architecture decisions

- **Firebase-only backend** — no Postgres/Drizzle for user/content data. The Express api-server is present for the monorepo template but unused by CrossNotes.
- **Static content, dynamic XP** — subject content (notes/flashcards/quiz) is bundled JSON; only user progress and leaderboard touch Firestore.
- **Graceful Firebase absence** — `isFirebaseReady` flag lets the app render with a warning banner when env vars are missing; no hard crash.
- **Replit plugins are conditional** — all three `@replit/*` vite plugins load only when `REPL_ID` is set; `PORT`/`BASE_PATH` fall back to 5173/`'/'` if unset, so `pnpm build` works anywhere with zero env vars.
- **mockup-sandbox excluded from production build** — root `pnpm run build` uses `--filter '!./artifacts/mockup-sandbox'`.

## Product

- **Dashboard** — XP bar, streak ring, continue-learning card, subject quick-links, live leaderboard preview
- **Subjects / Chapters** — browse live subjects; locked subjects shown as coming soon
- **Notes** — chapter notes with important-item highlights; marks +10 XP on completion
- **Flashcards** — flip-card study mode; marks +20 XP on completion
- **Quiz** — MCQ with explanations; awards up to +50 XP on first completion, retries improve score
- **Progress** — per-chapter progress map with weak-chapter detection
- **Leaderboard** — real-time top-25 by XP

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Firebase must be configured before auth/progress/leaderboard work. See `.env.example` for the six `VITE_FIREBASE_*` vars and the required Firebase Console setup checklist.
- After adding a new subject, drop a JSON file into `src/data/content/{slug}.json` AND add a `case` branch in `loadContent()` in `useContent.ts`.
- `@replit/*` packages stay in devDependencies (they're safe to install anywhere; they just do nothing when `REPL_ID` is absent).

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
