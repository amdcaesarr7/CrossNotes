/**
 * Vault types — mirrors the discipline already used in useContent.ts
 * (StaticChapter etc). Vault content lives in src/data/vault/*.json and is
 * loaded the same lazy-import way subject chapters are.
 *
 * Subsections are FIXED SLOTS (subsec1..subsec5), not a variable array.
 * That's deliberate: it lets a subject's vault file always have the same
 * shape, so Sunny can add content to an empty slot later without touching
 * any code. A slot renders only if it has a non-empty `entries` array —
 * `{}` or `{ "entries": [] }` both mean "skip this slot".
 */

export type VaultEntryKind = "past_paper" | "textbook" | "open_resource" | "study_asset";

export interface VaultEntry {
  id: string;                 // unique within the subject's vault file
  title: string;               // descriptive, e.g. "July 2023 Question Paper (English Medium)"
  kind: VaultEntryKind;
  year?: number;                // mainly for past_paper
  medium?: string;              // "English" | "Marathi" | "Hindi"
  license?: string;             // "CC BY-SA" | "Public/Government" — omit if N/A
  sourceUrl: string;            // "/vault/papers/geography/2023-july-en.pdf" (local)
                                 //  or "https://ebalbharati.in/..." (external, official)
  status: "verified" | "unverified";
  linkedChapterId?: string;     // if this paper is ALSO OCR'd into geography.json, e.g. "ch1"
}

/** One of the 5 fixed slots on a subject's Vault page. Empty object = hidden. */
export interface VaultSubsection {
  title?: string;
  emoji?: string;
  entries?: VaultEntry[];
}

export interface VaultSubjectContent {
  subsections: {
    subsec1?: VaultSubsection;
    subsec2?: VaultSubsection;
    subsec3?: VaultSubsection;
    subsec4?: VaultSubsection;
    subsec5?: VaultSubsection;
  };
}

/** A subsection is "visible" once it has a title and at least one entry. */
export function isVisibleSubsection(sub?: VaultSubsection): sub is VaultSubsection & { title: string; entries: VaultEntry[] } {
  return !!sub && !!sub.title && Array.isArray(sub.entries) && sub.entries.length > 0;
}
