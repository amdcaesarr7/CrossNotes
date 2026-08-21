import type { ReactNode } from 'react';
import { ExternalLink, Image as ImageIcon, Lightbulb } from 'lucide-react';

interface MathSolutionRendererProps {
  content: string;
  sourceUrl?: string;
}

const IMAGE_LINE = /^!\[([^\]]*)\]\((https?:\/\/[^)]+)\)$/;
const HEADING_LINE = /^#{1,6}\s+(.+)$/;
const LIST_LINE = /^(?:[-*]|\d+[.)]|[ivxlcdm]+\.)\s+(.+)$/i;

function isEquation(line: string) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  return (
    /[=≠≤≥∴√²³πθ∆∠]/.test(trimmed) ||
    /\b(?:sin|cos|tan|area|volume|mean|median|mode|probability)\b/i.test(trimmed) ||
    /\b[ivxlcdm]+\.\s*[-(\d]/i.test(trimmed) ||
    /^[\d(\-–]+\s*[a-z]\s*[+\-–]/i.test(trimmed)
  );
}

function renderInline(text: string): ReactNode {
  const pieces: ReactNode[] = [];
  const link = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = link.exec(text)) !== null) {
    if (match.index > cursor) pieces.push(text.slice(cursor, match.index));
    pieces.push(
      <a key={`${match[2]}-${match.index}`} href={match[2]} target="_blank" rel="noreferrer" className="solution-inline-link">
        {match[1]} <ExternalLink size={12} aria-hidden="true" />
      </a>,
    );
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) pieces.push(text.slice(cursor));
  return pieces.length ? pieces : text;
}

/**
 * Displays source-derived Maharashtra Board solution text without guessing or
 * rewriting the mathematics. Equations receive a readable aligned treatment,
 * while question labels and original worked-solution images stay visibly tied
 * to the official solution flow.
 */
export default function MathSolutionRenderer({ content, sourceUrl }: MathSolutionRendererProps) {
  const lines = content.split('\n');

  return (
    <div className="solution-reader">
      {sourceUrl && (
        <a className="solution-source-link" href={sourceUrl} target="_blank" rel="noreferrer">
          Source solution <ExternalLink size={13} />
        </a>
      )}

      <div className="solution-reader-body">
        {lines.map((rawLine, index) => {
          const line = rawLine.trim();
          if (!line) return <div key={`gap-${index}`} className="solution-gap" />;

          const image = line.match(IMAGE_LINE);
          if (image) {
            return (
              <figure className="solution-image" key={`image-${index}`}>
                <div className="solution-image-frame">
                  <img src={image[2]} alt={image[1] || 'Worked mathematics solution'} loading="lazy" />
                </div>
                {image[1] && <figcaption><ImageIcon size={13} /> {image[1]}</figcaption>}
              </figure>
            );
          }

          const heading = line.match(HEADING_LINE);
          if (heading) return <h3 key={`heading-${index}`} className="solution-section-heading">{renderInline(heading[1])}</h3>;

          if (/^question\s*\d+\.?$/i.test(line)) {
            return <p key={`question-${index}`} className="solution-question-label">{line}</p>;
          }

          if (/^(solution|answer)\s*:?$/i.test(line)) {
            return (
              <p key={`solution-${index}`} className="solution-answer-label">
                <Lightbulb size={14} aria-hidden="true" /> {line.replace(/:$/, '')}
              </p>
            );
          }

          const list = line.match(LIST_LINE);
          if (list && !isEquation(line)) {
            return <p key={`list-${index}`} className="solution-list-item"><span>•</span>{renderInline(list[1])}</p>;
          }

          if (isEquation(line)) return <p key={`math-${index}`} className="solution-math-line">{renderInline(line)}</p>;

          return <p key={`text-${index}`} className="solution-paragraph">{renderInline(line)}</p>;
        })}
      </div>
    </div>
  );
}
