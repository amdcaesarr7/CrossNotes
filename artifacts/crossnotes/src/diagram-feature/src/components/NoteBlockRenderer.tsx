import type { ReactNode } from 'react';
import { HelpCircle, ClipboardList, GitBranch } from 'lucide-react';
import type { StaticNote, DiagramBranch } from '@/hooks/useContent';

/** One note can be the original plain title+content card, or a rich
 *  study block (fill_blank, match_column, true_false, qna, list, table,
 *  heading, rules). Missing `type` = legacy card, still fully supported.
 *
 *  NOTE: these blocks are for READING, not testing — that's what Quiz is
 *  for. So fill_blank / match_column / true_false / qna all show their
 *  correct answer directly, with no "check my answer" step. */
export default function NoteBlockRenderer({ note, index }: { note: StaticNote; index: number }) {
  switch (note.type) {
    case 'heading':
      return (
        <h2 className="font-display font-black text-lg mt-2" style={{ color: 'var(--text)' }}>
          {note.content ?? note.title}
        </h2>
      );

    case 'list':
      return (
        <NoteCard note={note} index={index}>
          {note.ordered ? (
            <ol className="flex flex-col gap-2 pl-5" style={{ listStyle: 'decimal' }}>
              {(note.items ?? []).map((item, i) => (
                <li key={i} className="text-sm leading-relaxed font-medium" style={{ color: 'var(--text)' }}>{item}</li>
              ))}
            </ol>
          ) : (
            <ul className="flex flex-col gap-2">
              {(note.items ?? []).map((item, i) => (
                <li key={i} className="text-sm leading-relaxed font-medium flex items-start gap-2" style={{ color: 'var(--text)' }}>
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
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  {(note.headers ?? []).map((h, i) => (
                    <th key={i} className="text-left font-bold px-2 py-2" style={{ color: 'var(--text)', borderBottom: '2px solid var(--divider)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(note.rows ?? []).map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-2 py-2" style={{ color: 'var(--text)', borderBottom: '1px solid var(--divider)' }}>{cell}</td>
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

    case 'paragraph':
    default:
      // Legacy shape: title + content, exactly as before.
      return (
        <NoteCard note={note} index={index}>
          <div className="flex flex-col gap-2.5">
            {(note.content || '').split('\n').map((line, li) =>
              line.trim() === ''
                ? <br key={li} />
                : <p key={li} className="text-sm leading-relaxed font-medium" style={{ color: 'var(--text)' }}>{line}</p>
            )}
          </div>
        </NoteCard>
      );
  }
}

function NoteCard({ note, index, children }: { note: StaticNote; index: number; children: ReactNode }) {
  return (
    <div id={`note-${note.id}`} className={`note-card${note.important ? ' important' : ''}`}>
      {note.important && (
        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-xs font-black uppercase tracking-wider" style={{ color: '#92400e' }}>✨ Might be on boards!</span>
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

// ---- Fill in the blanks ----
// `content` holds the sentence with "___" placeholders; `blanks` holds the
// answers in order. This is a study block, not a quiz — the correct word
// is shown filled in directly, plus (if the source text listed multiple
// choice options) a word-bank chip row with the right one highlighted.

function FillBlankBlock({ note, index }: { note: StaticNote; index: number }) {
  const blanks = note.blanks ?? [];
  const rawContent = note.content ?? '';
  // Some source content bundles "Options: (i) A (ii) B ..." at the end —
  // split that off so it can be shown as a proper chip row.
  const optionsMatch = rawContent.match(/Options:\s*(.+)$/i);
  const sentencePart = optionsMatch ? rawContent.slice(0, optionsMatch.index).trim() : rawContent;
  const optionChips = optionsMatch
    ? optionsMatch[1].split(/\(i+v?\)|\(v\)/i).map(s => s.trim()).filter(Boolean)
    : [];
  const parts = sentencePart.split('___');

  return (
    <NoteCard note={{ ...note, title: note.title ?? 'Fill in the Blanks' }} index={index}>
      <p className="text-sm leading-loose font-medium" style={{ color: 'var(--text)' }}>
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

// ---- Match the column ----
// A study block, not a quiz: each left item is shown already paired with
// its matching right item, in order, so it can be read straight through.

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

// ---- True / False ----

function TrueFalseBlock({ note, index }: { note: StaticNote; index: number }) {
  return (
    <NoteCard note={{ ...note, title: note.title ?? 'True or False?' }} index={index}>
      <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>{note.statement}</p>
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

// ---- Q&A ----
// Answer shown directly underneath — this is notes, not a quiz.

function QnaBlock({ note, index }: { note: StaticNote; index: number }) {
  return (
    <NoteCard note={{ ...note, title: note.title ?? 'Quick Question' }} index={index}>
      <p className="text-sm font-semibold mb-3 flex items-start gap-2" style={{ color: 'var(--text)' }}>
        <HelpCircle size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--primary)' }} /> {note.question}
      </p>
      <p className="text-sm font-medium p-3 rounded-xl" style={{ background: 'var(--primary-light)', color: 'var(--text)' }}>{note.qnaAnswer}</p>
    </NoteCard>
  );
}

// ---- Rules (official exam instructions) ----
// A distinct, numbered "this is straight from the board" visual — used for
// the general instructions block at the top of a Question Paper chapter.

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

// ---- Diagram (root node + up to 9 branches) ----
// Built for classification/branching content — e.g. "Types of X", "Causes of
// Y". `branches` is a fixed-feel 9-slot array, but a slot only renders if
// its value is non-null: `null` (or a missing/blank entry) is skipped
// entirely, so JSON can always declare 9 slots and only fill in the ones
// that matter without leaving gaps in the layout. Pure CSS flex-wrap, no
// absolute positioning — so it reflows cleanly instead of breaking on
// narrow phones or when a label wraps to two lines.

function normalizeDiagramBranch(entry: DiagramBranch | string | null | undefined): DiagramBranch | null {
  if (entry === null || entry === undefined) return null; // the "don't render" case
  if (typeof entry === 'string') {
    const label = entry.trim();
    return label.length > 0 ? { label } : null;
  }
  if (!entry.label || !entry.label.trim()) return null;
  return entry;
}

function DiagramBlock({ note, index }: { note: StaticNote; index: number }) {
  const rootLabel = note.diagramRoot ?? note.title ?? 'Diagram';
  const branches = (note.branches ?? [])
    .slice(0, 9) // configured for up to 9 branches
    .map(normalizeDiagramBranch)
    .filter((b): b is DiagramBranch => b !== null);

  return (
    <div id={`note-${note.id}`} className="diagram-card">
      <div className="rules-card-header">
        <GitBranch size={18} style={{ color: 'var(--primary)' }} />
        <span className="rules-card-badge">Diagram</span>
      </div>

      <div className="diagram-root">{rootLabel}</div>

      {branches.length > 0 && (
        <>
          <div className="diagram-stem" aria-hidden="true" />
          <div className={`diagram-branches${branches.length > 1 ? ' diagram-branches-multi' : ''}`}>
            {branches.map((b, i) => (
              <div key={i} className="diagram-branch">
                <span className="diagram-branch-label">{b.label}</span>
                {b.note && <span className="diagram-branch-note">{b.note}</span>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
