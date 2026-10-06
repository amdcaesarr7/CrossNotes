# CrossNotes UX Overhaul Plan

**Status:** Planning only — no feature implementation in this doc.  
**Date:** 2026-09-20  
**Live product:** https://crossnotes.rf.gd/  
**App package:** `artifacts/crossnotes/`

This plan is the roadmap for fixing install, visuals, notes/diagrams, sounds, settings IA, and streaks — without another round of ad-hoc UI “garbage.” Binding rules live in [`DESIGN_RULES.md`](./DESIGN_RULES.md) and `.cursor/rules/crossnotes-ui-ux.mdc`.

---

## 1. What’s broken today (audit)

| Area | Current state | Why it fails |
|------|---------------|--------------|
| **Header “quick settings”** | Sound + dark toggles sit in `AppHeader` *and* again in `SettingsDialog` | Duplicate controls, crowded chrome, violates “one place for preferences” |
| **Install** | First-use tour step 0 + buried Settings section; `useInstallPrompt` is thin | Easy to skip; iOS/Android paths unclear; no persistent soft prompt after dismiss; value of install not felt |
| **Visual system** | Claymorphic CSS (`crossnotes.css` ~2.5k lines + `premium.css`), rotated subject cards, heavy shadows, emoji-first copy | Looks playful but unprofessional; hierarchy is noisy; hard for agents to extend without more clutter |
| **Notes / diagrams** | `DiagramBlock` = CSS root + ≤9 branch chips; no textbook image figures; labels not spatially bound to parts | Board diagrams (biology, geography, physics) don’t read as real study material; dual-coding fail |
| **Sound** | Synthesized SFX in `lib/sfx.ts`; used in Quiz / Flashcards / Shop / celebrate | Thin palette; missing note-complete, install, soft UI confirmations; no “study session” feel |
| **Streak** | Calendar-day streak + freezes in `computeStreakUpdate`; tied to any XP write | Good bones, weak product story: unclear what counts, anxiety on break, freezes under-explained, no gentle recovery |
| **IA** | Feedback modal + settings + coins + avatar + icon buttons in one header strip | Too many competing actions above the fold on mobile |

---

## 2. Psychology research (what we design against)

Sources informing this plan (habit formation, gamification, multimedia learning):

1. **Habit automaticity reduces motivational conflict while studying** — app-guided repetition of a defined study habit increases automaticity and lowers want-conflict during the activity ([Frontiers, 2020](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2020.00167/full)).
2. **Streaks drive repetition but create app-dependency and loss anxiety** — reminders + streaks help people show up; fear of breaking a streak can become fragile ([Don’t Kick the Habit, CHI](https://doi.org/10.1145/2851581.2892495)). Design for recovery, not punishment.
3. **Streaks must attach to real learning actions** — rewarding any tiny tap produces grind; attach streaks to notes / flashcards / quiz completion ([Lingoat / habit + SRS synthesis](https://lingoat.app/en/blog/gamification-language-learning-apps/)).
4. **Retrieval practice + spacing beat restudy** — Dunlosky “high utility” techniques; flashcards/quiz are the learning loop; dashboard should push “continue the loop,” not vanity opens.
5. **Gamify consistency of learning, not performance theater** — Sailer & Homner meta-analysis: small–moderate effects; combined elements beat isolated badges; don’t reward rushing ([RCT on educational gamification](https://doi.org/10.1007/s40692-025-00366-x)).
6. **Cognitive load / one job per screen** — Duolingo-style single-focus screens + immediate feedback keep germane load on studying, not chrome ([cognitive load UI guidance](https://www.aufaitux.com/blog/cognitive-load-theory-ui-design/)).
7. **Dual coding + Mayer multimedia principles for diagrams** — words + *relevant* pictures; **spatial contiguity** (labels next to parts); **coherence** (no decorative junk); avoid split-attention between figure and distant legend ([Mayer CTML](https://link.springer.com/article/10.1007/s10648-023-09842-1), [dual coding practice](https://glasp.co/articles/dual-coding)).

### Design implications for CrossNotes

| Principle | Product rule |
|-----------|--------------|
| Habit loop | One obvious “next action” on Dashboard (continue chapter / weak quiz) |
| Learning loop | Streaks + XP only for completing notes, flashcards, or quiz (already mostly true — keep it) |
| Loss aversion | Streak freezes + “streak saved” celebration; never shame a broken streak |
| Cognitive load | Strip header to brand + account; prefs in Settings only |
| Dual coding | Notes diagrams: image figures with inline labels, or structured trees with clear hierarchy — never orphaned captions |
| Sound | Feedback for *learning events*, opt-in, soft by default |

---

## 3. Target experience (north star)

A Class 10 student opens CrossNotes and within **5 seconds** knows:

1. What to study next  
2. Whether today’s streak is safe  
3. How to get into a chapter without fighting chrome  

The app should feel like a **calm exam notebook + short practice loop**, not a carnival of buttons.

**Mew** stays as companion voice — but fewer interruptions; install and settings are professional, not meme-first.

---

## 4. Workstreams (planned phases)

Implement in this order. Do not start Phase 3 until Phase 1–2 IA is decided in code.

### Phase 0 — Guardrails (this deliverable)
- [x] Write this plan  
- [x] Write `DESIGN_RULES.md` + Cursor rule so future PRs can’t reintroduce header toggles, rotated cards, etc.
- [x] Global voice module (`lib/voice.ts`) — sarcastic Indian-teen humour

### Phase 1 — Information architecture cleanup
**Goal:** Remove “quick settings”; one home for preferences.

- [x] Remove sound + theme icon buttons from `AppHeader`
- [x] Account menu: Progress · Settings · Credits · Feedback · Sign out
- [x] Settings dialog owns: theme, sound, install (+ feedback entry for guests)
- [x] Header left: brand / back. Header right: coins + avatar (guests: Settings gear + sign-in)

### Phase 2 — Install experience
**Goal:** Install feels intentional, platform-correct, and repeatable.

- [x] Dedicated **Install sheet** (`InstallSheet` + `InstallPanel`)
- [x] Soft prompt after study via `signalStudyComplete` / `InstallSoftPrompt` (14-day dismiss cooldown; tour must be done first)
- [x] First-use tour: install optional, never blocks advance
- [x] Settings reuses `InstallPanel`
- [x] `appinstalled` → toast + `sfx.installSuccess`

### Phase 3 — Visual system (professional study UI)
**Goal:** One composition language; reduce clay circus.

- [x] Design tokens: surface/ink/accent + space/type + elev-0/1/2
- [x] Kill decorative card rotation (subjects, stats, tilts)
- [x] Quieter shadows via `--elev-*` (cards/notes/subjects)
- [x] Notes body ≥16px / 1.65 line-height
- [x] Dashboard first viewport: greeting + streak/XP + **one** primary CTA; rest below
- [x] Calmer page background + softer blobs; `cn-enter` motion + reduced-motion respect
- [ ] Further page-by-page polish (Subject, Quiz chrome) — incremental

### Phase 4 — Notes & diagrams
**Goal:** Board-quality reading, especially diagrams.

- [x] Extended content model in `useContent.ts`: `figure` with `figureLabels[]`, `callout` (`tip`/`definition`/`formula`/`warning`), `diagram` with nested `children`.
- [x] Built `FigureBlock` + `FigureLightbox` (full-screen expand, pinned spatial-contiguity labels, pinch/zoom hint).
- [x] Built `CalloutBlock` for exam tips, definitions, formulas, and warnings.
- [x] Upgraded `DiagramBlock` with nested children tree support and `DiagramBranchNode`.
- [x] Authored vector SVG asset `/figures/gravitation-force.svg` and updated `science-1.json` with sample figure, callout, and diagram notes.
- [x] Added complete CSS for diagrams, figures, lightboxes, and callouts in `crossnotes.css`.

### Phase 5 — Sound & feedback
**Goal:** Study feels responsive without noise.

- [x] Expanded `sfx.ts`: `noteComplete`, `sessionDone`, `installSuccess`, `uiTap`, `correct`, `wrong`, `flip`, `levelUp`, `streakMilestone`, `streakSaved`.
- [x] Wired `sfx.noteComplete()` in `Notes.tsx` when marking notes read.
- [x] Wired `sfx.sessionDone()` in `Quiz.tsx` and `Flashcards.tsx` on set completion.
- [x] Sound unlocks cleanly on first user pointerdown; Settings toggle remains single source of truth; zero noise on route changes.

### Phase 6 — Streak logic & UX
**Goal:** Streaks reinforce study habit without cruelty.

- [x] Built `studyTracker.ts` utility: tracks YYYY-MM-DD study dates for weekly habit monitoring.
- [x] Built `StreakCard.tsx`: weekly 5-day goal progress, 7-day pill calendar, streak freeze status badge, and clear qualification rules modal/tooltip.
- [x] Updated `celebrate.ts` to log study dates automatically on every completed study action (notes/quiz/flashcards).
- [x] Recovery & loss-aversion framing in `lib/voice.ts` — warm, encouraging copy on streak resets.

### Phase 7 — Polish, a11y, ship
- Focus states, reduced-motion, contrast.
- PageSpeed: don’t regress mobile score.
- Manual test matrix: Android Chrome install, iOS Safari A2HS, offline notes, streak freeze consume, diagram zoom.

---

## 5. Explicit non-goals (for this overhaul)

- Full spaced-repetition scheduler (FSRS) — future; don’t block UI fix.
- Play Store native app — PWA path stays.
- Rewriting all subject JSON in one PR — migrate diagrams incrementally.
- Removing Mew / XP / Shop — refine, don’t gut identity.

---

## 6. Suggested implementation order (PRs)

1. **PR-A** — Header IA: remove quick settings; Settings owns theme/sound/install  
2. **PR-B** — Install sheet + soft prompt + tour trim  
3. **PR-C** — Design tokens + Dashboard/header visual cleanup (no content schema change)  
4. **PR-D** — Notes `figure` + diagram renderer upgrade + CSS for reading mode  
5. **PR-E** — Sound expansion + celebrate wiring  
6. **PR-F** — Streak UX copy + weekly study days + freeze education (+ optional grace)  
7. **PR-G** — Content pass: top diagram chapters  

Each PR must pass `DESIGN_RULES.md` checklist in the PR description.

---

## 7. Success metrics (lightweight)

| Signal | Target |
|--------|--------|
| Install prompt accept / A2HS attempts | Up vs baseline (log `appinstalled` if analytics later) |
| Time-to-first-chapter from cold open | Down |
| Streak break → return within 7 days | Up (recovery framing) |
| Qualitative: “notes/diagrams readable” | Student feedback |
| Lighthouse mobile | No regression vs current |

---

## 8. Next step after plan approval

Start **PR-A** (remove header quick settings; consolidate into Settings). Everything else waits on that IA so we don’t polish the wrong chrome.
