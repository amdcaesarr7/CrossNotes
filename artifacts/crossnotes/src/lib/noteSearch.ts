import type { StaticNote, DiagramBranch } from '@/hooks/useContent';

function branchText(b: DiagramBranch | string | null | undefined): string {
  if (!b) return '';
  if (typeof b === 'string') return b;
  return [b.label, b.note, ...(b.children ?? []).map(branchText)].filter(Boolean).join(' ');
}

/** Flatten every readable field of a note into one lowercase string. */
export function noteSearchText(n: StaticNote): string {
  const parts: (string | undefined)[] = [
    n.title, n.content, n.statement, n.question, n.qnaAnswer, n.instructions,
    n.diagramRoot, n.figureAlt, n.figureCaption,
    ...(n.items ?? []), ...(n.headers ?? []), ...(n.rows ?? []).flat(),
    ...(n.blanks ?? []), ...(n.left ?? []), ...(n.right ?? []), ...(n.rules ?? []),
    ...(n.branches ?? []).map(branchText),
    ...(n.figureLabels ?? []).map(l => l.text),
    ...(n.answerGroups ?? []).flatMap(g => g.entries.flatMap(e => [e.question, e.answer])),
  ];
  return parts.filter(Boolean).join(' ').toLocaleLowerCase();
}

/** Every whitespace-separated term must appear (AND match). */
export function matchesQuery(haystack: string, query: string): boolean {
  const terms = query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return terms.every(t => haystack.includes(t));
}
