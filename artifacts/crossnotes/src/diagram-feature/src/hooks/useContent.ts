/**
 * Static content hooks — read subjects/chapters/notes/flashcards/quiz from
 * bundled JSON files in src/data/content/{slug}.json.
 *
 * To add a new subject: drop a JSON file matching the slug into that folder.
 * These hooks NEVER touch Firestore. Firestore is only for leaderboard & XP.
 */

import { useState, useEffect } from "react";
import subjects, { getSubjectBySlug, type SubjectMeta } from "@/data/subjects";
export type { SubjectMeta };

// ---- Types (match the JSON schema) ----

// A note is either the original simple flashcard-style note (title+content,
// no `type` field — still fully supported, nothing breaks) OR a rich content
// block for interactive/structured material. Every field beyond `id` is
// optional so a JSON author only fills in what a given block type needs —
// no discriminated-union boilerplate to fight with.
export type NoteBlockType =
  | "paragraph" | "heading" | "list" | "table"
  | "fill_blank" | "match_column" | "true_false" | "qna" | "rules" | "diagram";

/** One branch of a "diagram" block. Can also just be a plain string (shorthand
 *  for { label } with no sub-note). */
export interface DiagramBranch {
  label: string;
  note?: string; // optional short sub-line under the branch label
}

export interface StaticNote {
  id: string;
  type?: NoteBlockType;      // omitted = legacy plain note (title + content)
  title?: string;
  content?: string;          // plain text; for fill_blank, the sentence with ___ placeholders
  important?: boolean;

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

  // type: "rules" — numbered official instructions (e.g. board paper rules)
  rules?: string[];

  // type: "diagram" — a root node with up to 9 branches. `title` (or
  // `diagramRoot` if you want it distinct from the card title) is the
  // centre node. Provide up to 9 entries in `branches` — a slot that is
  // `null` (or just omitted, leaving fewer than 9 entries) is skipped
  // entirely and never renders, so a fixed 9-slot array can be filled in
  // partially without leaving empty boxes on screen. Each entry is either
  // a plain string or a { label, note? } object.
  diagramRoot?: string;
  branches?: (DiagramBranch | string | null)[];
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
  overview?: StaticChapterOverview;
  notes: StaticNote[];
  flashcards: StaticFlashcard[];
  quiz: StaticQuizQuestion[];
}

interface SubjectContent {
  chapters: StaticChapter[];
}

// ---- Dynamic JSON loader ----
// Vite bundles each import() as a separate lazy chunk.

async function loadContent(slug: string): Promise<SubjectContent | null> {
  try {
    switch (slug) {
      case "science-1": {
        const m = await import("@/data/content/science-1.json");
        return m.default as SubjectContent;
      }
      case "science-2": {
        const m = await import("@/data/content/science-2.json");
        return m.default as SubjectContent;
      }
      case "maths-1": {
        const m = await import("@/data/content/maths-1.json");
        return m.default as SubjectContent;
      }
      case "maths-2": {
        const m = await import("@/data/content/maths-2.json");
        return m.default as SubjectContent;
      }
      case "english": {
        const m = await import("@/data/content/english.json");
        return m.default as SubjectContent;
      }
      case "marathi": {
        const m = await import("@/data/content/marathi.json");
        return m.default as SubjectContent;
      }
      case "hindi": {
        const m = await import("@/data/content/hindi.json");
        return m.default as SubjectContent;
      }
      case "history": {
        const m = await import("@/data/content/history.json");
        return m.default as SubjectContent;
      }
      case "geography": {
        const m = await import("@/data/content/geography.json");
        return m.default as SubjectContent;
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
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

/** Chapters for a subject (async JSON load). */
export function useStaticChapters(slug: string) {
  const [chapters, setChapters] = useState<StaticChapter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    setLoading(true);
    loadContent(slug).then(content => {
      setChapters(content?.chapters ?? []);
      setLoading(false);
    });
  }, [slug]);

  return { chapters, loading };
}

/** Single chapter by id. */
export function useStaticChapter(slug: string, chapterId: string) {
  const [chapter, setChapter] = useState<StaticChapter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug || !chapterId) { setLoading(false); return; }
    setLoading(true);
    loadContent(slug).then(content => {
      const found = content?.chapters.find(c => c.id === chapterId) ?? null;
      setChapter(found);
      setLoading(false);
    });
  }, [slug, chapterId]);

  return { chapter, loading };
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
