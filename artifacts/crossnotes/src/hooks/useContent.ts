/**
 * Static content hooks — read subjects/chapters/notes/flashcards/quiz from
 * per-chapter JSON files served from public/data/{slug}/{chapterId}.json.
 * The manifest at /data/manifest.json is fetched once per session on mount.
 *
 * To add a new subject: add its chapter files and manifest entries under
 * public/data/, then add the subject to subjects.ts. Source JSON remains the
 * migration input; it is not bundled into the application.
 * These hooks NEVER touch Firestore. Firestore is only for leaderboard & XP.
 */

import { useState, useEffect } from "react";
import subjects, { getSubjectBySlug, type SubjectMeta } from "@/data/subjects";
import {
  loadManifest,
  loadChapter,
  type ManifestChapterMeta,
} from "@/lib/contentLoader";

export type { SubjectMeta };
export type { ManifestChapterMeta };

// ---- Types (match the JSON schema) ----

// A note is either the original simple flashcard-style note (title+content,
// no `type` field — still fully supported, nothing breaks) OR a rich content
// block for interactive/structured material. Every field beyond `id` is
// optional so a JSON author only fills in what a given block type needs —
// no discriminated-union boilerplate to fight with.
export type NoteBlockType =
  | "paragraph" | "heading" | "list" | "table"
  | "fill_blank" | "match_column" | "true_false" | "qna" | "rules"
  | "diagram" | "figure" | "callout" | "markdown" | "answer_sets";

export interface StaticAnswerSetEntry {
  id: string;
  question: string;
  answer?: string;
  unavailableReason?: string;
  questionTag?: string;
  source?: {
    printedPage?: number;
    pdfPage?: number;
  };
}

/** Entries remain grouped in source order; group identifiers are never rendered. */
export interface StaticAnswerSetGroup {
  id: string;
  entries: StaticAnswerSetEntry[];
}

/** One branch of a "diagram" block. Can also just be a plain string (shorthand
 *  for { label } with no sub-note). Supports one level of nested `children`. */
export interface DiagramBranch {
  label: string;
  note?: string; // optional short sub-line under the branch label
  children?: (DiagramBranch | string | null)[];
}

/** Pinned callout on a figure — x/y are % of the image box (0–100). */
export interface FigureLabel {
  text: string;
  x: number;
  y: number;
  /** Optional side hint for the label chip (default: near the pin). */
  side?: "left" | "right" | "top" | "bottom";
}

export type CalloutKind = "tip" | "definition" | "formula" | "warning";

export interface StaticNote {
  id: string;
  type?: NoteBlockType;      // omitted = legacy plain note (title + content)
  title?: string;
  content?: string;          // plain text; for fill_blank, the sentence with ___ placeholders
  important?: boolean;
  sourceUrl?: string;         // original solution page, used by imported board solutions
  solutionPages?: Record<string, string>; // compiled native answer by reader page ID

  // type: "list"
  items?: string[];
  ordered?: boolean;

  // type: "table"
  headers?: string[];
  rows?: string[][];

  // type: "fill_blank" — one entry in `blanks` per ___ in `content`, in order
  blanks?: string[];

  // type: "match_column"
  instructions?: string;
  left?: string[];
  right?: string[];
  answerKey?: number[];      // answerKey[i] = index into `right` that matches `left[i]`

  // type: "true_false"
  statement?: string;
  answer?: boolean;

  // type: "qna"
  question?: string;
  qnaAnswer?: string;

  // type: "answer_sets" — grouped question/answer entries; group IDs are internal.
  answerGroups?: StaticAnswerSetGroup[];

  // type: "rules" — numbered official instructions (e.g. board paper rules)
  rules?: string[];

  // type: "diagram" — root + branches (optional nested children). `title` or
  // `diagramRoot` is the centre node. Null/blank branch slots are skipped.
  diagramRoot?: string;
  branches?: (DiagramBranch | string | null)[];

  // type: "figure" — textbook-style image with optional pinned labels
  figureSrc?: string;        // public path, e.g. /figures/gravitation-force.svg
  figureAlt?: string;
  figureCaption?: string;
  figureLabels?: FigureLabel[];

  // type: "callout" — exam tip / definition / formula / warning
  calloutKind?: CalloutKind;
}

export interface StaticChapterOverview {
  summary: string;
  youWillLearn?: string[];
}

export interface StaticFlashcard {
  id: string;
  front: string;
  back: string;
  order: number;
}

export type QuizType = "mcq" | "fill_blank" | "true_false" | "match";

export interface StaticQuizQuestion {
  id: string;
  qType?: QuizType;          // omitted = "mcq", fully backward compatible
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  order: number;

  // qType: "fill_blank" — sentence with a single ___ placeholder, plus a
  // tappable word bank (distractors + the right answer) instead of typing
  sentence?: string;
  wordBank?: string[];
  correctWord?: string;

  // qType: "true_false"
  statement?: string;
  answer?: boolean;

  // qType: "match" — same shape as the note match_column block
  left?: string[];
  right?: string[];
  answerKey?: number[];
}

export interface StaticChapter {
  id: string;
  num: number;
  title: string;
  emoji?: string;
  kind?: "chapter" | "paper"; // "paper" = a reproduced board question paper
  section?: string;           // e.g. "History" | "Political Science"
  part?: number;              // 1, 2, 3
  overview?: StaticChapterOverview;
  notes: StaticNote[];
  flashcards: StaticFlashcard[];
  quiz: StaticQuizQuestion[];
}

// ---- Hooks ----

/** All subjects (instant — no async). */
export function useStaticSubjects() {
  return subjects;
}

/** Single subject by slug (instant). */
export function useStaticSubject(slug: string): SubjectMeta | undefined {
  return getSubjectBySlug(slug);
}

/**
 * Lightweight chapter list for a subject.
 * Loads the manifest (once per session) and returns ManifestChapterMeta[]
 * sorted by order. No chapter content is fetched — Subject page only needs
 * title, id, num, and counts for the chapter list.
 */
export function useStaticChapters(slug: string) {
  const [chapters, setChapters] = useState<ManifestChapterMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setChapters([]);
      setLoading(false);
      return;
    }

    let alive = true;
    setLoading(true);
    loadManifest()
      .then((manifest) => {
        if (!alive) return;
        const subject = manifest.subjects.find((s) => s.slug === slug);
        const sorted = (subject?.chapters ?? [])
          .slice()
          .sort((a, b) => a.order - b.order);
        setChapters(sorted);
      })
      .catch(() => {
        if (alive) setChapters([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => { alive = false; };
  }, [slug]);

  return { chapters, loading };
}

/**
 * Single chapter by id — fetches /data/{slug}/{chapterId}.json on demand.
 * Returns the full StaticChapter (notes, flashcards, quiz included).
 * `error` is non-null when the chapter could not be loaded.
 */
export function useStaticChapter(slug: string, chapterId: string) {
  const [chapter, setChapter] = useState<StaticChapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug || !chapterId) {
      setChapter(null);
      setError(null);
      setLoading(false);
      return;
    }

    let alive = true;
    setLoading(true);
    setError(null);
    setChapter(null);

    loadChapter(slug, chapterId).then((found) => {
      if (!alive) return;
      setChapter(found);
      if (!found) setError("Chapter could not be loaded.");
      setLoading(false);
    });

    return () => { alive = false; };
  }, [slug, chapterId]);

  return { chapter, loading, error };
}

/** Notes for a specific chapter. */
export function useStaticNotes(slug: string, chapterId: string) {
  const { chapter, loading } = useStaticChapter(slug, chapterId);
  return { notes: chapter?.notes ?? [], loading };
}

/** Flashcards for a specific chapter. */
export function useStaticFlashcards(slug: string, chapterId: string) {
  const { chapter, loading } = useStaticChapter(slug, chapterId);
  const sorted = (chapter?.flashcards ?? []).slice().sort((a, b) => a.order - b.order);
  return { flashcards: sorted, loading };
}

/** Quiz questions for a specific chapter. */
export function useStaticQuiz(slug: string, chapterId: string) {
  const { chapter, loading } = useStaticChapter(slug, chapterId);
  const sorted = (chapter?.quiz ?? []).slice().sort((a, b) => a.order - b.order);
  return { questions: sorted, loading };
}
