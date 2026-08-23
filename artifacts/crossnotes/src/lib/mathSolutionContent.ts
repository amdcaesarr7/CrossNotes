const IMAGE_TOKEN = /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g;

function isSourceBoilerplate(line: string): boolean {
  const compact = line.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
  if (!compact || compact.startsWith('![')) return false;

  return (
    /maharashtraboardsolutions\.com/i.test(compact)
    || /(?:Balbharti\s+)?Maharashtra State Board Class 10 Maths Solutions/i.test(compact)
    || /Questions With Answers Maharashtra Board/i.test(compact)
    || /^[-*]\s*\[?(?:Practice|Problem)\s+Set\s+[\d.]+(?:\s+Class\s+10)?\s+Answers/i.test(compact)
  );
}

function splitImagesFromLine(line: string): string[] {
  const tokens: string[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;
  IMAGE_TOKEN.lastIndex = 0;

  while ((match = IMAGE_TOKEN.exec(line)) !== null) {
    const before = line.slice(cursor, match.index).trim();
    if (before) tokens.push(before);
    tokens.push(match[0]);
    cursor = match.index + match[0].length;
  }

  if (tokens.length === 0) return [line];

  const after = line.slice(cursor).trim();
  // Scraper residue such as a trailing single "a" after an image has no study
  // value and would otherwise appear as a distracting paragraph.
  if (after && !/^[a-z]$/i.test(after)) tokens.push(after);
  return tokens;
}

/**
 * Normalizes source-derived Maths solution content at render time. It does not
 * alter the underlying mathematics: only source attribution boilerplate,
 * duplicate outbound Practice/Problem Set lists, scraper residue, and packed
 * image syntax are removed or separated for a native CrossNotes reading flow.
 */
export function normalizeMathSolutionContent(content: string): string {
  const normalizedLines = content
    .replace(/\r\n/g, '\n')
    .split('\n')
    .flatMap(splitImagesFromLine)
    .map(line => line.trim())
    .filter(line => !isSourceBoilerplate(line));

  const compacted: string[] = [];
  let previousWasBlank = false;
  for (const line of normalizedLines) {
    const isBlank = line.length === 0 || line === '---';
    if (isBlank) {
      if (!previousWasBlank && compacted.length > 0) compacted.push('');
    } else {
      compacted.push(line);
    }
    previousWasBlank = isBlank;
  }

  return compacted.join('\n').trim();
}

/** Returns a direct image origin when WordPress's resize proxy fails. */
export function getMathImageFallbackUrl(source: string): string | null {
  if (!/^https?:\/\/i0\.wp\.com\//i.test(source)) return null;
  return source
    .replace(/^https?:\/\/i0\.wp\.com\//i, 'https://')
    .replace(/[?&]resize=[^&]+/i, '')
    .replace(/[?&]ssl=1/i, '')
    .replace(/\?&?/, '?')
    .replace(/\?$/, '');
}
