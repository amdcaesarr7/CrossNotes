# CrossNotes Design Rules

**Audience:** humans and AI agents editing `artifacts/crossnotes/`.  
**Full roadmap:** [`UX_OVERHAUL_PLAN.md`](./UX_OVERHAUL_PLAN.md).  
**If a change conflicts with these rules, the rules win unless the user explicitly overrides them.**

These rules exist because prior UI work piled on duplicate controls, decorative clay effects, and chrome that competed with studying.

---

## 0. Product north star

CrossNotes is a **calm Class 10 Maharashtra Board study tool**.  
Every screen has **one job**. Studying beats decoration.

---

## 0b. Voice & humour (global)

**Source of truth:** `artifacts/crossnotes/src/lib/voice.ts`

Tone for user-facing copy (UI chrome, toasts, tour, dashboard, empty states):

- Sarcastic, funny, warm — **Indian adolescent** humour (board exams, Sharma ji’s beta, relatives, “mood nahi tha”).
- Light roast of procrastination — **never** bully the student, body-shame, caste/religion jokes, or exam-failure cruelty.
- Hindi–English mix is fine in **motivational / roast lines**; keep **buttons and critical instructions** clear English with attitude.
- No corporate “synergy”, no teacher lecture voice, no spammy emoji walls.
- New copy should import from `VOICE` / `DAILY_ROASTS` / `TOUR_STEPS` or match that vibe in the same file.

**Do not** “professionalize” the voice into bland edtech speak unless the user asks.

---

## 1. Information architecture

### Header
- **Allowed:** brand / back · optional coins · avatar (account menu). Guests may get a **Settings** gear (opens Settings dialog — not inline toggles).
- **Forbidden in the header:** theme toggle, sound toggle, “quick settings,” dense icon rows, permanent Feedback button.
- Preferences live in **Settings** (dialog or `/settings`) only — one source of truth.
- Feedback belongs in the **account menu** (signed-in) or via Settings (guests).

### Navigation
- Bottom nav: primary study destinations only (Home, Study, Vault, Ranks — or an approved equivalent).
- Progress stays in account menu unless research proves otherwise.
- Do not add a fifth bottom-nav tab without removing another.

### Dashboard first viewport
- Greeting + streak/XP status + **one** primary continue CTA.
- No leaderboard tables, subject grids, shop promos, or install banners fighting for the first viewport at once.
- Progressive disclosure: secondary blocks below the fold.

---

## 2. Install (PWA)

- Platform-correct paths: Android `beforeinstallprompt`; iOS Share → Add to Home Screen; never pretend iOS supports the same prompt.
- Soft prompt after a **meaningful study action** (`celebrateActivityResult` → `signalStudyComplete`), not on first paint spam.
- Respect dismiss (**14-day** cooldown via `cn-install-dismiss-until`). Do not re-show every reload; once per browser session max.
- Wait until first-use tour is complete/skipped before soft prompting.
- Shared UI: `InstallPanel` + `InstallSheet` — do not invent a third install UI.
- Install copy explains **offline + home-screen speed**, not gimmicks (see `lib/voice.ts`).
- On `appinstalled`: success toast + `sfx.installSuccess()`.
- Do not bury install only inside a long first-use tour; tour install step stays optional.

---

## 3. Visual system

### Do
- Use shared **design tokens** in `crossnotes.css`: `--surface`, `--ink`, `--accent`, `--elev-0/1/2`, `--space-*`, `--text-*`.
- One elevation scale (`--elev-0` / `--elev-1` / `--elev-2`). Prefer quiet surfaces for notes.
- Body text for notes: `font-size: var(--text-body)` (≥16px) and `line-height: var(--leading-body)` (~1.65).
- Motion: intentional, few (`cn-enter`, XP, streak save) — respect `prefers-reduced-motion`.
- Dashboard first viewport = greeting + streak/XP + **one** primary CTA only.

### Don’t
- Rotate / skew cards for “personality.”
- Stack multi-layer neon glows, pill clusters, floating badges on content.
- Default to purple-gradient AI aesthetic or newspaper-dense layouts.
- Ship a second unrelated visual language in the same PR (“just this one special card”).
- Use emoji as the primary information carrier in UI chrome (copy can be warm; structure stays clear).
- Reintroduce thick clay “offset brick” shadows on content cards — use `--elev-*`.

### Clay / mascot
- Claymorphic accents are optional decoration on **primary controls**, never on long-form notes.
- Mew is a companion, not a modal gauntlet. Max one proactive interrupt per session unless user-triggered.

---

## 4. Notes and diagrams (learning science)

Follow dual coding / Mayer multimedia constraints:

1. **Coherence** — No decorative images. Every figure teaches.
2. **Spatial contiguity** — Labels sit on or beside the part they name; no distant-only legends when labels can pin to the figure.
3. **Split-attention** — Keep explanation next to the diagram; don’t force scroll-hunting.
4. **Notes ≠ quiz** — Study blocks may reveal answers; Quiz is for retrieval testing.

### Diagram types
- Prefer `figure` (real image + alt + optional pinned labels) for textbook diagrams.
- Use CSS `diagram` trees only for simple classifications (types / causes / steps).
- Support lightbox / pinch-zoom for large figures.
- Never clip diagrams inside tiny cards without a way to expand.

### Content JSON
- When adding a subject: JSON under `src/data/content/{slug}.json` **and** `loadContent()` case in `useContent.ts`.
- Prefer structured blocks (`heading`, `list`, `table`, `figure`, `diagram`, `qna`, …) over walls of plain text.

---

## 5. Sound

- Sounds feedback **learning events** (correct/wrong, flip, complete, streak save, level-up) — not every click and route change.
- Synthesized / local audio preferred (no fragile remote URLs).
- Settings toggle is authoritative; header must not reintroduce a mute button.
- Fail silent: audio must never crash the app.
- Unlock AudioContext on a user gesture.

---

## 6. Streaks and XP (psychology-safe gamification)

### Rules
- Streaks attach to **real study completions** (notes / flashcards / quiz XP paths) — never to app open alone.
- Always provide **freeze / recovery** language. Never shame a broken streak.
- Explain freezes in UI (“covers one missed day”).
- Prefer adding a **weekly study-days** backup metric over making daily streaks more punishing.
- Gamify **showing up to study**, not rushing quizzes for points.
- Any streak formula change must update this file + user-visible copy in the same PR.

### Current intended model (until Phase 6 ships changes)
- Calendar-day streak; freezes max 3; earn freeze on milestones; XP writes update streak.
- Optional grace-after-midnight and weekly metric are planned — implement only with explicit UX copy.

---

## 7. CSS and components

- Prefer tokens + shared classes over one-off inline style soups on every page.
- New UI goes through existing components (`AppHeader`, Settings, note renderers) before inventing parallel systems.
- Do not grow `crossnotes.css` with copy-pasted card variants — extract or reuse.
- Respect `prefers-reduced-motion`.
- Touch targets ≥ 44×44px where possible.

---

## 8. PR checklist (required)

Before merging UI work, confirm:

- [ ] No new header quick-settings (theme/sound).
- [ ] No rotated/decorative-only card treatments.
- [ ] First viewport of touched screens still has one primary job.
- [ ] Notes/diagrams: labels near content; expandable if large.
- [ ] Sounds only on meaningful events; Settings still owns mute.
- [ ] Streak copy is recovery-friendly if streak UX changed.
- [ ] Mobile layout checked; dark mode checked if tokens touched.
- [ ] New user-facing copy matches `lib/voice.ts` (sarcastic Indian-teen, not bland edtech).

---

## 9. Anti-patterns library (do not reintroduce)

| Anti-pattern | Instead |
|--------------|---------|
| Sound + moon icons in header | Settings rows |
| Install only as tour step 0 | Install sheet + Settings + soft prompt |
| Subject cards with CSS rotate | Flat, aligned grid |
| Diagram as unlabeled emoji collage | `figure` / labeled `diagram` |
| “You broke your streak 😭” | “New streak starts today” + freeze tip |
| Dashboard as widget dump | Continue CTA first; rest below |
| Parallel Settings UIs | One Settings surface |

---

## 10. When unsure

1. Read `UX_OVERHAUL_PLAN.md` for the phase you’re in.  
2. Prefer **removing** chrome over adding a control.  
3. Ask: “Does this help a student revise a chapter faster?” If no, cut it.
