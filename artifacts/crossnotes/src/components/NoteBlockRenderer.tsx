import { useState, type ReactNode } from 'react';
import { HelpCircle, ClipboardList, GitBranch, ImageIcon, Lightbulb, BookOpen, FunctionSquare, AlertTriangle, Maximize2, BookmarkCheck } from 'lucide-react';
import type { CalloutKind, DiagramBranch, StaticNote } from '@/hooks/useContent';
import MathSolutionRenderer from '@/components/MathSolutionRenderer';
import FigureLightbox from '@/components/FigureLightbox';
import { isImportedSolution } from '@/lib/importedSolutions';

/** One note can be the original plain title+content card, or a rich
 *  study block. Missing `type` = legacy card, still fully supported.
 *
 *  NOTE: study blocks are for READING, not testing — Quiz handles retrieval.
 *  fill_blank / match_column / true_false / qna show answers directly. */
export default function NoteBlockRenderer({ note, index }: { note: StaticNote; index: number }) {
  if (isImportedSolution(note)) {
    return (
      <NoteCard note={note} index={index}>
        <MathSolutionRenderer content={note.content ?? ''} sourceUrl={note.sourceUrl} />
      </NoteCard>
    );
  }

  switch (note.type) {
    case 'heading':
      return (
        <div className="note-heading-card">
          <span className="note-heading-bullet" />
          <h2 className="font-display font-black text-base" style={{ color: 'var(--text)' }}>
            {note.content ?? note.title}
          </h2>
        </div>
      );

    case 'list':
      return (
        <NoteCard note={note} index={index}>
          {note.ordered ? (
            <ol className="note-prose flex flex-col gap-2 pl-5" style={{ listStyle: 'decimal' }}>
              {(note.items ?? []).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ol>
          ) : (
            <ul className="note-prose flex flex-col gap-2">
              {(note.items ?? []).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="shrink-0" style={{ color: 'var(--primary)' }}>•</span> {item}
                </li>
              ))}
            </ul>
          )}
        </NoteCard>
      );

    case 'table':
      return (
        <NoteCard note={note} index={index}>
          <div className="note-table-scroll">
            <table className="note-table">
              <thead>
                <tr>
                  {(note.headers ?? []).map((h, i) => (
                    <th key={i} className={i === 0 ? 'sticky-col' : undefined}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(note.rows ?? []).map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci} className={ci === 0 ? 'sticky-col' : undefined}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </NoteCard>
      );

    case 'fill_blank':
      return <FillBlankBlock note={note} index={index} />;

    case 'match_column':
      return <MatchColumnBlock note={note} index={index} />;

    case 'true_false':
      return <TrueFalseBlock note={note} index={index} />;

    case 'qna':
      return <QnaBlock note={note} index={index} />;

    case 'rules':
      return <RulesBlock note={note} index={index} />;

    case 'diagram':
      return <DiagramBlock note={note} index={index} />;

    case 'figure':
      return <FigureBlock note={note} index={index} />;

    case 'callout':
      return <CalloutBlock note={note} index={index} />;

    case 'paragraph':
    default:
      if (/^pdf26-s\d{2}-/.test(note.id) || note.id.startsWith('pdf26-extras-')) {
        return <QuestionSetBlock note={note} index={index} />;
      }
      return (
        <NoteCard note={note} index={index}>
          <div className="note-prose flex flex-col gap-2.5">
            {(note.content || '').split('\n').map((line, li) =>
              line.trim() === ''
                ? <br key={li} />
                : <p key={li}>{line}</p>
            )}
          </div>
        </NoteCard>
      );
  }
}

type QuestionSetSection = {
  kind: 'question' | 'answer' | 'note' | 'heading';
  content: string;
};

function getQuestionSetSections(content: string): QuestionSetSection[] {
  const formatted = content
    .replace(/(?<!^)\s+(Answer:)/g, '\n\n$1')
    .replace(/\s+(Assignment answers are not (?:in|printed in) the supplied PDF;)/g, '\n\n$1')
    .replace(/\s+(The July 2025 answers are not printed in the supplied PDF;|The July 2025 answer key is QR-coded)/g, '\n\n$1')
    .replace(/\s+(July \d{4} Board Paper|July \d{4} Practice Board Paper|Assignment|Set 21 \(July \d{4} Board Paper\))/g, '\n\n$1');
  const sections: QuestionSetSection[] = [];
  let activeKind: QuestionSetSection['kind'] = 'question';

  for (const paragraph of formatted.split(/\n\s*\n/).map(part => part.trim()).filter(Boolean)) {
    const heading = paragraph.match(/^(July \d{4} Board Paper|July \d{4} Practice Board Paper|Assignment|Set 21 \(July \d{4} Board Paper\))\s*—\s*(.*)$/i);
    if (heading) {
      sections.push({ kind: 'heading', content: heading[1] });
      if (heading[2]) {
        activeKind = 'question';
        sections.push({ kind: activeKind, content: heading[2] });
      }
      continue;
    }

    const answer = paragraph.match(/^(?:Ans\.|Answer:)\s*/i);
    if (answer) {
      activeKind = 'answer';
      sections.push({ kind: activeKind, content: paragraph.slice(answer[0].length) });
      continue;
    }

    if (/^(?:Note\s*:|Assignment answers are not (?:in|printed in) the supplied PDF;|The July 2025 answers are not printed in the supplied PDF;|The July 2025 answer key is QR-coded)/i.test(paragraph)) {
      sections.push({ kind: 'note', content: paragraph });
      continue;
    }

    if (activeKind === 'answer' && /^(?:Q\.|(?:\(\d+\)\s*)?(?:What|Why|How|Which|Where|When|Who|Name|List|Give|Write|Explain|Describe|State|Prepare|Identify|Match|Mention|Differentiate|During|Suppose|If|Precautions|Items|Compare|Classify|Enumerate|Discuss)\b)/i.test(paragraph)) {
      activeKind = 'question';
    }

    const previous = sections[sections.length - 1];
    if (previous?.kind === activeKind) previous.content += `\n\n${paragraph}`;
    else sections.push({ kind: activeKind, content: paragraph });
  }

  return sections;
}

function QuestionSetBlock({ note, index }: { note: StaticNote; index: number }) {
  const sections = getQuestionSetSections(note.content ?? '');

  return (
    <NoteCard note={note} index={index}>
      <div className="qna-container">
        {sections.map((section, sectionIndex) => {
          if (section.kind === 'heading') {
            return (
              <h3 key={sectionIndex} className="font-display font-bold text-sm" style={{ color: 'var(--primary)' }}>
                {section.content}
              </h3>
            );
          }

          const answer = section.kind === 'answer';
          const noteSection = section.kind === 'note';
          return (
            <div
              key={sectionIndex}
              className={answer ? 'qna-answer-box' : noteSection ? 'question-set-note' : 'qna-question-box'}
            >
              {!noteSection && (
                <span className={`qna-badge ${answer ? 'qna-badge-a' : 'qna-badge-q'}`}>
                  {answer ? 'Ans.' : 'Q.'}
                </span>
              )}
              <div className="note-prose flex-1">
                {section.content.split('\n').map((line, lineIndex) =>
                  line.trim() ? <p key={lineIndex}>{line}</p> : <br key={lineIndex} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </NoteCard>
  );
}

function NoteCard({ note, index, children }: { note: StaticNote; index: number; children: ReactNode }) {
  return (
    <div id={`note-${note.id}`} className={`note-card${note.important ? ' important' : ''}${isImportedSolution(note) ? ' solution-note' : ''}`}>
      {note.important && (
        <div className="note-high-yield" aria-label="High-yield reminder">
          <BookmarkCheck size={14} aria-hidden="true" />
          <span>Worth remembering</span>
        </div>
      )}
      {note.title && (
        <h2 className="font-display font-bold text-base mb-3 flex items-start gap-2" style={{ color: 'var(--text)' }}>
          <span className="font-black opacity-40 shrink-0" style={{ color: 'var(--primary)' }}>{String(index + 1).padStart(2, '0')}.</span>
          {note.title}
        </h2>
      )}
      {children}
    </div>
  );
}

function FillBlankBlock({ note, index }: { note: StaticNote; index: number }) {
  const blanks = note.blanks ?? [];
  const rawContent = note.content ?? '';
  const optionsMatch = rawContent.match(/Options:\s*(.+)$/i);
  const sentencePart = optionsMatch ? rawContent.slice(0, optionsMatch.index).trim() : rawContent;
  const optionChips = optionsMatch
    ? optionsMatch[1].split(/\(i+v?\)|\(v\)/i).map(s => s.trim()).filter(Boolean)
    : [];
  const parts = sentencePart.split('___');

  return (
    <NoteCard note={{ ...note, title: note.title ?? 'Fill in the Blanks' }} index={index}>
      <p className="note-prose leading-loose">
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < blanks.length && <span className="fill-blank-target">{blanks[i]}</span>}
          </span>
        ))}
      </p>
      {optionChips.length > 0 && (
        <div className="answer-chip-row">
          {optionChips.map((opt, i) => (
            <span key={i} className={`answer-chip${opt.trim().toLowerCase() === (blanks[0] ?? '').trim().toLowerCase() ? ' is-correct' : ''}`}>
              {opt}
            </span>
          ))}
        </div>
      )}
    </NoteCard>
  );
}

function MatchColumnBlock({ note, index }: { note: StaticNote; index: number }) {
  const left = note.left ?? [];
  const right = note.right ?? [];
  const answerKey = note.answerKey ?? [];

  return (
    <NoteCard note={{ ...note, title: note.title ?? 'Match the Column' }} index={index}>
      {note.instructions && <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>{note.instructions}</p>}
      <div className="flex flex-col gap-2">
        {left.map((item, i) => {
          const matchIdx = answerKey[i];
          const matched = matchIdx !== undefined ? right[matchIdx] : undefined;
          return (
            <div key={i} className="match-pair-row">
              <span className="text-xs font-semibold flex-1" style={{ color: 'var(--text)' }}>{i + 1}. {item}</span>
              <span className="match-pair-arrow">→</span>
              <span className="text-xs font-bold flex-1" style={{ color: 'var(--primary)' }}>
                {matched ? `${String.fromCharCode(65 + matchIdx)}. ${matched}` : '—'}
              </span>
            </div>
          );
        })}
      </div>
    </NoteCard>
  );
}

function TrueFalseBlock({ note, index }: { note: StaticNote; index: number }) {
  return (
    <NoteCard note={{ ...note, title: note.title ?? 'True or False?' }} index={index}>
      <p className="note-prose font-semibold mb-3">{note.statement}</p>
      <div className="flex gap-2">
        {[true, false].map((v) => {
          const isAnswer = v === note.answer;
          return (
            <div
              key={String(v)}
              className="flex-1 py-2.5 text-sm font-bold rounded-xl border-2 text-center flex items-center justify-center gap-1.5"
              style={{
                borderColor: isAnswer ? '#16a34a' : 'var(--divider)',
                background: isAnswer ? '#dcfce7' : 'var(--bg-card-2)',
                color: isAnswer ? '#166534' : 'var(--text-muted)',
                opacity: isAnswer ? 1 : 0.6,
              }}
            >
              {v ? 'True' : 'False'} {isAnswer && '✓'}
            </div>
          );
        })}
      </div>
    </NoteCard>
  );
}

function QnaBlock({ note, index }: { note: StaticNote; index: number }) {
  const sameTitleAndQuestion = note.title?.trim() === note.question?.trim();
  const title = sameTitleAndQuestion ? undefined : note.title ?? (note.question ? undefined : 'Question & Answer');
  return (
    <NoteCard note={{ ...note, title }} index={index}>
      <div className="qna-container">
        <div className="qna-question-box">
          <span className="qna-badge qna-badge-q">Q.</span>
          <p className="note-prose font-bold flex-1">{note.question}</p>
        </div>
        <div className="qna-answer-box">
          <span className="qna-badge qna-badge-a">Ans.</span>
          <p className="note-prose flex-1">{note.qnaAnswer}</p>
        </div>
      </div>
    </NoteCard>
  );
}

function RulesBlock({ note, index }: { note: StaticNote; index: number }) {
  const rules = note.rules ?? [];
  return (
    <div id={`note-${note.id}`} className="rules-card">
      <div className="rules-card-header">
        <ClipboardList size={18} style={{ color: 'var(--primary)' }} />
        <span className="rules-card-badge">Official Instructions</span>
      </div>
      {note.content && (
        <p className="text-sm font-black mb-2" style={{ color: 'var(--text)' }}>{note.content}</p>
      )}
      {rules.length > 0 && (
        <div className="rules-list">
          {rules.map((rule, i) => (
            <div key={i} className="rules-list-item">
              <span className="rules-list-number">{i + 1}</span>
              <span className="rules-list-text">{rule}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface NormalizedDiagramBranch {
  label: string;
  note?: string;
  children?: NormalizedDiagramBranch[];
}

function normalizeDiagramBranch(entry: DiagramBranch | string | null | undefined): NormalizedDiagramBranch | null {
  if (entry === null || entry === undefined) return null;
  if (typeof entry === 'string') {
    const label = entry.trim();
    return label.length > 0 ? { label } : null;
  }
  if (!entry.label || !entry.label.trim()) return null;
  const children = (entry.children ?? [])
    .map(normalizeDiagramBranch)
    .filter((b): b is NormalizedDiagramBranch => b !== null);
  return { label: entry.label, note: entry.note, children: children.length ? children : undefined };
}

function DiagramBranchNode({ branch }: { branch: NormalizedDiagramBranch }) {
  return (
    <div className="diagram-branch">
      <span className="diagram-branch-label">{branch.label}</span>
      {branch.note && <span className="diagram-branch-note">{branch.note}</span>}
      {branch.children && branch.children.length > 0 && (
        <div className="diagram-children" aria-label={`Sub-branches of ${branch.label}`}>
          {branch.children.map((child, i) => (
            <div key={`${child.label}-${i}`} className="diagram-child">
              <span>{child.label}</span>
              {child.note && <small>{child.note}</small>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Classification / branching diagram — nested children allowed, no absolute positioning. */
function DiagramBlock({ note, index }: { note: StaticNote; index: number }) {
  const rootLabel = note.diagramRoot ?? note.title ?? 'Diagram';
  const branches = (note.branches ?? [])
    .slice(0, 12)
    .map(normalizeDiagramBranch)
    .filter((b): b is NormalizedDiagramBranch => b !== null);

  return (
    <div id={`note-${note.id}`} className="diagram-card">
      <div className="rules-card-header">
        <GitBranch size={18} style={{ color: 'var(--primary)' }} />
        <span className="rules-card-badge">Diagram</span>
      </div>
      {note.title && note.diagramRoot && note.title !== note.diagramRoot && (
        <p className="diagram-card-title">{note.title}</p>
      )}

      <div className="diagram-root">{rootLabel}</div>

      {branches.length > 0 && (
        <>
          <div className="diagram-stem" aria-hidden="true" />
          <div className={`diagram-branches${branches.length > 1 ? ' diagram-branches-multi' : ''}`}>
            {branches.map((b, i) => (
              <DiagramBranchNode key={`${b.label}-${i}`} branch={b} />
            ))}
          </div>
        </>
      )}
      {note.content && <p className="diagram-caption note-prose">{note.content}</p>}
    </div>
  );
}

const CALLOUT_META: Record<CalloutKind, { label: string; Icon: typeof Lightbulb }> = {
  tip: { label: 'Exam tip', Icon: Lightbulb },
  definition: { label: 'Definition', Icon: BookOpen },
  formula: { label: 'Formula', Icon: FunctionSquare },
  warning: { label: 'Watch out', Icon: AlertTriangle },
};

function CalloutBlock({ note, index }: { note: StaticNote; index: number }) {
  const kind: CalloutKind = note.calloutKind ?? 'tip';
  const meta = CALLOUT_META[kind];
  const Icon = meta.Icon;

  return (
    <aside id={`note-${note.id}`} className={`note-callout note-callout-${kind}`} aria-label={meta.label}>
      <div className="note-callout-header">
        <Icon size={16} aria-hidden="true" />
        <span>{note.title ?? meta.label}</span>
      </div>
      <div className="note-prose note-callout-body">
        {(note.content || '').split('\n').map((line, li) =>
          line.trim() === '' ? <br key={li} /> : <p key={li}>{line}</p>
        )}
      </div>
    </aside>
  );
}

function FigureBlock({ note, index }: { note: StaticNote; index: number }) {
  const [open, setOpen] = useState(false);
  const src = note.figureSrc ?? '';
  const alt = note.figureAlt ?? note.title ?? 'Figure';
  const labels = note.figureLabels ?? [];

  if (!src) {
    return (
      <NoteCard note={note} index={index}>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Figure missing `figureSrc`.</p>
      </NoteCard>
    );
  }

  return (
    <figure id={`note-${note.id}`} className="figure-card">
      <div className="rules-card-header">
        <ImageIcon size={18} style={{ color: 'var(--primary)' }} />
        <span className="rules-card-badge">Figure</span>
        {note.title && <span className="figure-card-title">{note.title}</span>}
      </div>

      <button
        type="button"
        className="figure-stage"
        onClick={() => setOpen(true)}
        aria-label={`Expand figure: ${alt}`}
      >
        <img src={src} alt={alt} loading="lazy" decoding="async" />
        {labels.map((label, i) => (
          <span
            key={`${label.text}-${i}`}
            className={`figure-pin figure-pin-${label.side ?? 'right'}`}
            style={{ left: `${label.x}%`, top: `${label.y}%` }}
          >
            <i aria-hidden="true" />
            <em>{label.text}</em>
          </span>
        ))}
        <span className="figure-expand-chip" aria-hidden="true"><Maximize2 size={14} /> Expand</span>
      </button>

      {(note.figureCaption || note.content) && (
        <figcaption className="figure-caption note-prose">{note.figureCaption ?? note.content}</figcaption>
      )}

      <FigureLightbox
        open={open}
        src={src}
        alt={alt}
        caption={note.figureCaption ?? note.content}
        labels={labels}
        onClose={() => setOpen(false)}
      />
    </figure>
  );
}
