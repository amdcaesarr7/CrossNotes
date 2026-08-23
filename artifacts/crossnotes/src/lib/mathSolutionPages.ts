import { normalizeMathSolutionContent } from '@/lib/mathSolutionContent';

export interface MathSolutionPage {
  id: string;
  label: string;
  content: string;
}

const MAX_LINES_PER_PAGE = 88;

function isQuestionStart(rawLine: string): boolean {
  const line = rawLine.replace(/\*\*/g, '').trim();
  return line.length > 0 && line.length < 180 && /\bQuestion\s+\d+(?:[.:]|\b)/i.test(line);
}

function pageLabel(lines: string[], fallbackIndex: number): string {
  const questionLine = lines
    .map(line => line.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim())
    .find(line => /\bQuestion\s+\d+(?:[.:]|\b)/i.test(line));

  const question = questionLine?.match(/\bQuestion\s+(\d+)(?:[.:]|\b)/i);
  if (question) return `Question ${question[1]}`;
  return fallbackIndex === 0 ? 'Set overview' : `Worked examples · ${fallbackIndex + 1}`;
}

function splitLongSegment(lines: string[]): string[][] {
  if (lines.length <= MAX_LINES_PER_PAGE) return [lines];

  const pages: string[][] = [];
  let cursor = 0;
  while (cursor < lines.length) {
    const remaining = lines.length - cursor;
    if (remaining <= MAX_LINES_PER_PAGE) {
      pages.push(lines.slice(cursor));
      break;
    }

    const roughEnd = cursor + MAX_LINES_PER_PAGE;
    let splitAt = roughEnd;
    for (let index = roughEnd; index > cursor + Math.floor(MAX_LINES_PER_PAGE * 0.58); index -= 1) {
      if (!lines[index]?.trim()) {
        splitAt = index + 1;
        break;
      }
    }
    pages.push(lines.slice(cursor, splitAt));
    cursor = splitAt;
  }

  return pages;
}

/**
 * Keeps imported Maharashtra Board material intact while breaking a dense
 * solution document into question-led study pages. Pages never reword or drop
 * source text; pagination only changes how much is shown at once.
 */
export function getMathSolutionPages(content: string): MathSolutionPage[] {
  const lines = normalizeMathSolutionContent(content).split('\n');
  if (lines.length === 0) return [];

  const segments: string[][] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (isQuestionStart(line) && current.some(entry => entry.trim().length > 0)) {
      segments.push(current);
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.some(entry => entry.trim().length > 0)) segments.push(current);

  const pages = segments.flatMap(splitLongSegment).filter(page => page.some(line => line.trim().length > 0));
  return pages.map((page, index) => ({
    id: `page-${index + 1}`,
    label: pageLabel(page, index),
    content: page.join('\n').trim(),
  }));
}
