import type { StaticNote } from '@/hooks/useContent';

/**
 * Imported Maharashtra Board solution pages intentionally retain the existing
 * legacy JSON shape. This detector recognises those page titles so the UI can
 * provide the richer worked-solution reader without changing the data contract.
 */
export type SolutionSetCategory = 'practice' | 'problem' | 'solution';

export function isImportedSolution(note: Pick<StaticNote, 'id' | 'type' | 'title' | 'content'>): boolean {
  if (note.type === 'markdown') return true;
  // The reader gives a selected set a short student-facing title (for example,
  // “Practice Set 1.1 · Question 2”). Its stable Maths import ID is the most
  // reliable way to keep that paginated page on the solution-renderer path.
  if (/^p[12]-c\d+-(?:set|problem)-\d+$/i.test(note.id)) return true;
  const title = note.title?.trim() ?? '';
  return /^(?:Practice Set|Problem Set)\s/i.test(title)
    && /(?:Maths|Geometry|Algebra|Class 10|10th)/i.test(title);
}

/**
 * Maps source-derived note metadata to a student-friendly Practice/Problem Set
 * label. The ID fallback keeps malformed imported titles discoverable instead
 * of exposing an unrelated URL or image name in the learning library.
 */
export function getSolutionSetLabel(note: Pick<StaticNote, 'id' | 'title'>): string {
  const title = note.title?.replace(/\s+/g, ' ').trim() ?? '';
  const titledSet = title.match(/\b(Practice|Problem)\s+Set\s*(\d+(?:\.\d+)?)/i);
  if (titledSet) return `${titledSet[1][0].toUpperCase()}${titledSet[1].slice(1).toLowerCase()} Set ${titledSet[2]}`;

  const idSet = note.id.match(/^p[12]-c(\d+)-(set|problem)-(\d+)$/i);
  if (idSet) return `${idSet[2].toLowerCase() === 'problem' ? 'Problem' : 'Practice'} Set ${idSet[1]}.${idSet[3]}`;

  return title && !/^https?:\/\//i.test(title) ? title : 'Worked solution';
}

export function getSolutionSetCategory(note: Pick<StaticNote, 'id' | 'title'>): SolutionSetCategory {
  return /\bProblem\s+Set\b/i.test(note.title ?? '') || /-problem-/i.test(note.id)
    ? 'problem'
    : /\bPractice\s+Set\b/i.test(note.title ?? '') || /-set-/i.test(note.id)
      ? 'practice'
      : 'solution';
}
