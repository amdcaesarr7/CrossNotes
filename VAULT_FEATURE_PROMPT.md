# CrossNotes: "Vault" Section — Feature Prompt

## What this is
A new top-level section of CrossNotes, separate from the subject/chapter
content. The Vault is a curated shelf of **official, legally-clean reference
material** — things that exist independently of any digest/guide, and that
students would otherwise have to go hunting for across government sites.

Do not treat this as a UI design task. Reuse whatever design system, theme,
colors, and components CrossNotes already has. This prompt only defines what
the feature does and how its data is shaped — the coding tool should look at
the existing app's patterns (how Subjects/Chapters are laid out, how the
mascot Totu and existing card/list components look) and just extend that,
not invent a new visual language.

## Why it exists
Distinguishes "stuff Sunny wrote/converted" (Chapters) from "stuff the
government/official bodies actually published" (Vault). Useful both as a
trust signal for users ("this is the real board paper, not a summary") and
as a place to dump the resources gathered from the copyright conversation:
past board question papers, official textbook links, DIKSHA/NROER content.

## Content types the Vault should support

1. **Past board question papers** (PYQs)
   - Organized by: subject → year → paper (some subjects split into
     Part 1/Part 2, e.g. Maths 1 & 2, Science 1 & 2)
   - Each entry: year, subject, medium (English/Marathi/etc.), a link or
     embedded PDF, and optionally the structured JSON version if it's already
     been through the OCR→JSON pipeline (reuse the `"kind": "paper"` chapter
     shape already established in `geography.json`'s ch1)

2. **Official textbook references**
   - Link-outs to eBalbharati PDFs per subject, not hosted/duplicated content
     — just a curated, verified link so students don't have to search
   - Should be clearly labeled as "official textbook," separate from
     CrossNotes' own notes

3. **Open/CC-licensed supplementary resources**
   - DIKSHA / NROER links per subject or chapter, where available
   - Include the license type where known (e.g. "CC BY-SA") so it's visible
     that this is legitimately reusable material, not a legal gray area

4. **(Optional, future) Verified vs unverified flag**
   - A simple status per entry — e.g. `"verified"` (Sunny checked the link
     still works and the source is legit) vs `"unverified"` (added but not
     yet double-checked) — so broken/stale links don't quietly rot in there

## Data model

Keep it consistent with the existing `subjects.ts` / chapter JSON
conventions already used elsewhere in CrossNotes (same `title`/`kind`
naming discipline established for the chapter format):

```ts
type VaultEntry = {
  id: string;
  subject: string;          // e.g. "maths-1", "science-2", "geography"
  title: string;            // descriptive name, not a generic label
  kind: "past_paper" | "textbook" | "open_resource";
  year?: number;            // for past_paper
  medium?: string;          // "English" | "Marathi" | "Hindi"
  license?: string;         // e.g. "CC BY-SA", "Public/Government", omit if N/A
  sourceUrl: string;        // official source, not a mirror unless no official link exists
  status: "verified" | "unverified";
  linkedChapterId?: string; // if this paper has also been OCR'd into JSON content, point to it
};
```

Store as `vault.json` (or per-subject `vault-<subject>.json` files, mirroring
how subject content is already split) rather than inventing a new backend —
same Firestore/static-JSON pattern already used for the rest of the app's
content.

## Behavior, not UI

- Filterable by subject and year at minimum; medium and kind as a bonus
- Each entry should link out to the real official source directly — Vault is
  a curated index, not a re-host, except for content already converted into
  CrossNotes' own JSON (which lives in the app itself, no external link
  needed)
- If a `linkedChapterId` exists, let the user jump straight into the
  converted chapter content from the Vault entry, instead of just opening a
  raw PDF
- No login/auth complexity needed unless CrossNotes already has that
  elsewhere — this is read-only reference material

## What NOT to do

- Don't duplicate/re-host copyrighted digest content (Navneet etc.) in here
  — that defeats the entire purpose of the Vault being the "clean" section
- Don't invent new visual components — reuse card/list patterns already in
  the Subject/Chapter views
- Don't over-engineer the verified/unverified flag into a whole moderation
  system — it's just a boolean-ish status for Sunny's own bookkeeping
