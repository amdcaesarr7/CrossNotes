import type { StaticNote } from '@/hooks/useContent';

/**
 * Imported Maharashtra Board solution pages intentionally retain the existing
 * legacy JSON shape. This detector recognises those page titles so the UI can
 * provide the richer worked-solution reader without changing the data contract.
 */
export function isImportedSolution(note: Pick<StaticNote, 'type' | 'title' | 'content'>): boolean {
  if (note.type === 'markdown') return true;
  const title = note.title?.trim() ?? '';
  return /^(?:Practice Set|Problem Set)\s/i.test(title)
    && /(?:Maths|Geometry|Algebra|Class 10|10th)/i.test(title);
}
