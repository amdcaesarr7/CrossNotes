import { type ReactNode, useState } from 'react';
import { ExternalLink, Image as ImageIcon, Lightbulb } from 'lucide-react';
import { getMathImageFallbackUrl, normalizeMathSolutionContent } from '@/lib/mathSolutionContent';

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

function imageCaption(rawAlt: string): string | null {
  const compact = rawAlt.replace(/^Image\s*\d+\s*:?\s*/i, '').replace(/\s+/g, ' ').trim();
  if (!compact || /(Maharashtra|Maths Solutions|Practice Set|Problem Set|Class \d+)/i.test(compact)) return null;
  return compact;
}

function SolutionImage({ source, rawAlt }: { source: string; rawAlt: string }) {
  const fallback = getMathImageFallbackUrl(source);
  const [imageSource, setImageSource] = useState(source);
  const [failed, setFailed] = useState(false);
  const caption = imageCaption(rawAlt);

  const handleError = () => {
    if (fallback && imageSource !== fallback) {
      setImageSource(fallback);
      return;
    }
    setFailed(true);
  };

  return (
    <figure className={`solution-image${failed ? ' is-unavailable' : ''}`}>
      <div className="solution-image-frame">
        {failed ? (
          <div className="solution-image-fallback"><ImageIcon size={20} /><span>Diagram unavailable on this device</span></div>
        ) : (
          <img
            src={imageSource}
            alt={caption ?? 'Worked mathematics diagram'}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={handleError}
          />
        )}
      </div>
      {caption && <figcaption><ImageIcon size={13} /> {caption}</figcaption>}
    </figure>
  );
}

/**
 * Renders imported Maths material as a native CrossNotes study reader. Source
 * boilerplate is removed upstream; mathematics, diagrams, questions, and
 * worked steps remain intact and readable.
 */
export default function MathSolutionRenderer({ content }: MathSolutionRendererProps) {
  const lines = normalizeMathSolutionContent(content).split('\n');

  return (
    <div className="solution-reader">
      <div className="solution-reader-body">
        {lines.map((rawLine, index) => {
          const line = rawLine.trim();
          if (!line) return <div key={`gap-${index}`} className="solution-gap" />;

          const image = line.match(IMAGE_LINE);
          if (image) return <SolutionImage key={`image-${index}`} source={image[2]} rawAlt={image[1]} />;

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
