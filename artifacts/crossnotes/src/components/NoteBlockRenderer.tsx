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
export default function NoteBlockRenderer({ note, index, subjectSlug }: { note: StaticNote; index: number; subjectSlug?: string }) {
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

    case 'answer_sets':
      return <AnswerSetsBlock note={note} index={index} separateSubanswers={subjectSlug === 'science-2'} />;

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

function AnswerSetsBlock({ note, index, separateSubanswers }: { note: StaticNote; index: number; separateSubanswers: boolean }) {
  const groups = note.answerGroups ?? [];
  const hasEntries = groups.some(group => group.entries.length > 0);
  const isOddOneOutSet = /odd one out/i.test(note.title ?? '');

  return (
    <NoteCard note={{ ...note, title: undefined }} index={index}>
      <div className={`answer-sets${separateSubanswers ? ' science-2-answer-sets' : ''}`}>
        {hasEntries ? groups.map(group => (
          <div className="answer-set-group" key={group.id}>
            {group.entries.map(entry => {
              const sourcePages = entry.source && [
                entry.source.printedPage !== undefined && `Book p. ${entry.source.printedPage}`,
                entry.source.pdfPage !== undefined && `PDF p. ${entry.source.pdfPage}`,
              ].filter(Boolean).join(' · ');
              const question = parseAnswerSetQuestion(
                compactAnswerSetText(entry.question),
                isOddOneOutSet,
                entry.questionTag,
              );
              const answer = compactAnswerSetText(
                entry.answer?.trim() || entry.unavailableReason || 'No answer was supplied for this entry.',
              );
              const answerParts = separateSubanswers ? parseAnswerSetAnswer(answer) : undefined;

              return (
                <section className="answer-set-entry" key={entry.id}>
                  <div className="answer-set-question">
                    <span className="qna-badge qna-badge-q">Q.</span>
                    <div className="answer-set-copy">
                      {question.prompt && <p className="note-prose">{question.prompt}</p>}
                      {question.options.length > 0 && (
                        <div className="answer-set-options" aria-label="Question options">
                          {question.options.map(option => (
                            <div className="answer-set-option" key={option.label}>
                              {option.label && <span className="answer-set-option-label">{option.label}</span>}
                              <span>{option.text}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {entry.questionTag && <span className="answer-set-tag">{entry.questionTag}</span>}
                      {sourcePages && <span className="answer-set-source">{sourcePages}</span>}
                    </div>
                  </div>
                  <div className="answer-set-answer">
                    <span className="qna-badge qna-badge-a">Ans.</span>
                    {answerParts ? (
                      <div className="answer-set-answer-parts">
                        {answerParts.map(part => (
                          <div className="answer-set-answer-part" key={part.label}>
                            <span className="answer-set-answer-label">{part.label}</span>
                            <p className="note-prose">{part.text}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="note-prose">{answer}</p>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )) : <p className="note-prose">No answer entries have been added.</p>}
      </div>
    </NoteCard>
  );
}

interface ParsedAnswerSetAnswerPart {
  label: string;
  text: string;
}

function parseAnswerSetAnswer(answer: string): ParsedAnswerSetAnswerPart[] | undefined {
  const markers = Array.from(answer.matchAll(/(?:^|\s)\(([a-z])\)\s*/gi));
  if (
    markers.length < 2 ||
    markers[0][1].toLowerCase() !== 'a' ||
    markers.some((marker, index) => marker[1].toLowerCase().charCodeAt(0) !== 97 + index)
  ) return undefined;

  return markers.map((marker, index) => {
    const start = marker.index! + marker[0].length;
    const end = markers[index + 1]?.index ?? answer.length;
    return {
      label: `(${marker[1].toLowerCase()})`,
      text: answer.slice(start, end).trim(),
    };
  }).filter(part => part.text.length > 0);
}

interface ParsedQuestionOption {
  label: string;
  text: string;
}

interface ParsedAnswerSetQuestion {
  prompt: string;
  options: ParsedQuestionOption[];
}

function compactAnswerSetText(text: string): string {
  return text.replace(/\n{2,}/g, '\n');
}

function parseAnswerSetQuestion(
  question: string,
  isOddOneOutSet: boolean,
  questionTag?: string,
): ParsedAnswerSetQuestion {
  const markers = Array.from(question.matchAll(/(?:^|\s)\(([A-Da-d])\)\s*/g));
  if (markers.length >= 2) {
    const options = markers.map((marker, index) => {
      const start = marker.index! + marker[0].length;
      const end = markers[index + 1]?.index ?? question.length;
      let text = question.slice(start, end).trim();
      if (index === markers.length - 1 && questionTag) {
        const tag = questionTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        text = text.replace(new RegExp(`\\s*\\(\\s*${tag}\\s*\\)\\s*$`, 'i'), '').trim();
      }
      return {
        label: `(${marker[1].toUpperCase()})`,
        text,
      };
    }).filter(option => option.text.length > 0);
    return {
      prompt: question.slice(0, markers[0].index).trim(),
      options,
    };
  }

  if (isOddOneOutSet) {
    const numberedQuestion = question.match(/^(\s*\(\d+\)\s*)([\s\S]*)$/);
    let list = numberedQuestion?.[2] ?? question;
    const date = list.match(/\s*\((?=[^)]*(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\b)[^)]*\)\s*$/i);
    if (date) list = list.slice(0, date.index).trim();
    const choices = list.split(/,\s*/).map(choice => choice.trim()).filter(Boolean);
    if (choices.length >= 3) {
      return {
        prompt: numberedQuestion ? numberedQuestion[1].trim() : '',
        options: choices.map((text, index) => ({
          label: `(${String.fromCharCode(97 + index)})`,
          text: text.replace(/\.\s*$/, ''),
        })),
      };
    }
  }

  return { prompt: question, options: [] };
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
  const title = note.title?.replace(/^2026 Question Set \d+:\s*/, '');

  return (
    <NoteCard note={{ ...note, title }} index={index}>
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
