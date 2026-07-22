---
name: CrossNotes Firebase wiring
description: Key decisions and gotchas for the CrossNotes Firestore/Firebase integration
---

## Architecture
- Firebase (Firestore + Auth) is the only backend — no Express/Postgres for user/content data.
- All 6 `VITE_FIREBASE_*` env vars must be set before the app is functional (see `artifacts/crossnotes/.env.example`).
- `isFirebaseReady` flag in AuthContext lets UI show a "Firebase not set up" banner gracefully.

## Content model
- Subject content (notes, flashcards, quiz) is stored as **bundled JSON** in `src/data/content/{slug}.json` — NOT in Firestore.
- Firestore holds only: subjects metadata, user profiles, user progress, leaderboard.
- To add a new subject: add JSON file + a `case` in `loadContent()` in `useContent.ts`.

## Progress data model
- Progress docs: `users/{uid}/progress/{chapterId}` — keyed by chapterId only (no subject prefix).
- Each write helper (`markNotesRead`, `markFlashcardsCompleted`, `saveQuizScore`) accepts optional `meta: { subjectSlug, chapterName }` and stores it in the progress doc on first write.
- Progress page reads `p.subjectSlug` from the doc to build revision links.

## XP rules (idempotent via transactions)
- Notes read: +10 XP once per chapter
- Flashcards done: +20 XP once per chapter
- Quiz: up to +50 XP on first completion only; retries update score if higher but award 0 XP

## Firebase Console checklist (user must do before launch)
1. Enable Authentication → Google sign-in provider
2. Add your domain to Authorized domains (Authentication → Settings → Authorized domains)
3. Create Firestore Database
4. Set Firestore rules (see `.env.example` for the full rules block)
