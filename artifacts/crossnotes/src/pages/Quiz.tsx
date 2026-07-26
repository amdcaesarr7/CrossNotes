import { useState } from 'react';
import { ChevronRight, RotateCcw, Loader2 } from 'lucide-react';
import { Link, useParams } from 'wouter';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { saveQuizScore } from '@/hooks/useFirestore';
import { useStaticSubject, useStaticChapter, useStaticQuiz, type StaticQuizQuestion } from '@/hooks/useContent';
import { sfx } from '@/lib/sfx';
import { fireConfetti } from '@/lib/confetti';
import { celebrateActivityResult } from '@/lib/celebrate';
import AppHeader from '@/components/AppHeader';
import '../crossnotes.css';

const CORRECT_MSGS = [
  "Correct! Caesar is impressed (barely). 📜",
  "Nailed it! Even the teacher is shocked. 👨‍🏫",
  "Yep! Einstein called — he's proud. 🧠",
  "Right answer! Your ancestors are smiling. ✅",
];
const WRONG_MSGS = [
  "Nope. Read the notes. Seriously. 📖",
  "Wrong. The board exam won't be this forgiving. 😬",
  "That's… not it. Don't tell your parents. 🙈",
  "Incorrect. But hey, you tried! Kind of. 😅",
];

function scoreResult(pct: number) {
  if (pct >= 90) return { emoji: '🏆', msg: "Board topper energy!", grade: 'A+', color: '#16a34a' };
  if (pct >= 70) return { emoji: '🎯', msg: "Solid work! Your future self thanks you.", grade: 'A',  color: '#2563eb' };
  if (pct >= 50) return { emoji: '😅', msg: "Halfway there. The glass is half full of wrong answers.", grade: 'B', color: '#d97706' };
  return { emoji: '💀', msg: "Yikes. Even Caesar's ghost is disappointed.", grade: 'F', color: '#dc2626' };
}

// One "answer" shape covers every question type so the rest of the page
// doesn't need to branch much:
//  - mcq          -> number   (index into q.options)
//  - true_false   -> boolean
//  - fill_blank   -> string   (the tapped word)
//  - match        -> Record<number, number>  (left index -> right index)
type QuizAnswer = number | boolean | string | Record<number, number> | null;

function isAnswered(qType: string, answer: QuizAnswer, q: StaticQuizQuestion): boolean {
  if (qType === 'match') {
    const left = q.left ?? [];
    const pairs = (answer as Record<number, number>) ?? {};
    return left.length > 0 && Object.keys(pairs).length === left.length;
  }
  return answer !== null && answer !== undefined;
}

function isCorrect(qType: string, answer: QuizAnswer, q: StaticQuizQuestion): boolean {
  if (qType === 'true_false') return answer === q.answer;
  if (qType === 'fill_blank') return typeof answer === 'string' && answer.trim().toLowerCase() === (q.correctWord ?? '').trim().toLowerCase();
  if (qType === 'match') {
    const left = q.left ?? [];
    const answerKey = q.answerKey ?? [];
    const pairs = (answer as Record<number, number>) ?? {};
    return left.length > 0 && left.every((_, i) => pairs[i] === answerKey[i]);
  }
  return answer === q.correctAnswer; // mcq
}

export default function Quiz() {
  const { isDark } = useTheme();
  const [idx, setIdx]           = useState(0);
  const [answer, setAnswer]     = useState<QuizAnswer>(null);
  const [revealed, setRevealed] = useState(false);
  const [scores, setScores]     = useState<boolean[]>([]);
  const [done, setDone]         = useState(false);
  const [saving, setSaving]     = useState(false);
  const [justPopped, setJustPopped] = useState(false);

  const params = useParams<{ slug: string; chapterId: string }>();
  const slug      = params.slug || '';
  const chapterId = params.chapterId || '';
  const { user } = useAuth();

  const subject = useStaticSubject(slug);
  const { chapter } = useStaticChapter(slug, chapterId);
  const { questions, loading } = useStaticQuiz(slug, chapterId);

  const q      = questions[idx];
  const qType  = q?.qType ?? 'mcq';
  const total  = questions.length;
  const progress = total > 0 ? (idx / total) * 100 : 0;

  const answered = q ? isAnswered(qType, answer, q) : false;

  const handleCheck = () => {
    if (!q || !answered) return;
    const correct = isCorrect(qType, answer, q);
    correct ? sfx.correct() : sfx.wrong();
    toast(correct ? CORRECT_MSGS[idx % CORRECT_MSGS.length] : WRONG_MSGS[idx % WRONG_MSGS.length], {
      icon: correct ? '✅' : '❌', duration: 2200,
    });
    setRevealed(true);
  };

  const handleNext = async () => {
    if (!q) return;
    const correct = isCorrect(qType, answer, q);
    const newScores = [...scores, correct];
    setScores(newScores);
    setJustPopped(true);
    setTimeout(() => setJustPopped(false), 400);

    if (idx < total - 1) {
      setIdx(i => i + 1); setAnswer(null); setRevealed(false);
    } else {
      setDone(true);
      const finalCorrect = newScores.filter(Boolean).length;
      const finalPct = total > 0 ? Math.round((finalCorrect / total) * 100) : 0;

      if (finalPct >= 90) {
        fireConfetti();
      }

      if (user) {
        setSaving(true);
        try {
          const result = await saveQuizScore(user.uid, chapterId, finalCorrect, total, { subjectSlug: slug, chapterName: chapter?.title });
          if (result.xp > 0) {
            const boostTag = result.boostMultiplier > 1 ? ` (🧪 ${result.boostMultiplier}x boosted!)` : '';
            toast.success(`+${result.xp} XP · +${result.coinsEarned} coins added! 🎉${boostTag}`);
          }
          celebrateActivityResult(result);
        } catch (err) { console.error(err); }
        finally { setSaving(false); }
      }
    }
  };

  const reset = () => { setIdx(0); setAnswer(null); setRevealed(false); setScores([]); setDone(false); };

  const correctCount = scores.filter(Boolean).length;
  const scorePct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const { emoji, msg, grade, color } = scoreResult(scorePct);

  return (
    <div className={`cn-body ${isDark ? 'dark-mode' : ''}`}>
      <AppHeader backHref={`/subject/${slug}`} backLabel={subject?.name ?? 'Back'} />

      <main className="immersive-content">
        {/* Title */}
        <div>
          <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: 'var(--primary)' }}>
            {subject?.name} · Quiz
          </p>
          <h1 className="font-display font-black text-xl leading-tight" style={{ color: 'var(--text)' }}>
            {chapter?.title ?? 'Loading…'}
          </h1>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <Loader2 size={30} style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : total === 0 ? (
          <div className="clay-card p-8 text-center">
            <p className="text-3xl mb-2">🤔</p>
            <p className="font-bold" style={{ color: 'var(--text)' }}>No questions yet.</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Add quiz questions to <code className="text-xs bg-gray-100 px-1 rounded">{slug}.json</code></p>
            <Link href={`/notes/${slug}/${chapterId}`}><button className="clay-btn mt-4">Read Notes Instead</button></Link>
          </div>
        ) : !done ? (
          <>
            {/* Progress */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                <span>Question {idx + 1} of {total}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="clay-progress h-2.5">
                <div className="clay-progress-fill" style={{ width: `${progress}%`, background: 'var(--primary)', transition: 'width 0.4s ease' }} />
              </div>
              <div className="quiz-dots">
                {questions.map((_, i) => {
                  const gotIt = scores[i];
                  const isPast = i < idx;
                  const isNow = i === idx;
                  const cls = [
                    'quiz-dot',
                    isNow ? 'is-current' : '',
                    isPast && gotIt === true ? 'is-correct' : '',
                    isPast && gotIt === false ? 'is-wrong' : '',
                    isPast && justPopped && i === idx - 1 ? 'pop' : '',
                  ].filter(Boolean).join(' ');
                  return <span key={i} className={cls} />;
                })}
              </div>
            </div>

            {/* Question — keyed on idx + qType so it slides in fresh each time */}
            <div key={`${idx}-${qType}`} className="quiz-slide-in flex flex-col gap-3">
              <div className="clay-card p-5">
                <p className="text-xs font-black uppercase tracking-wider mb-2" style={{ color: 'var(--primary)' }}>
                  Q{idx + 1} {qType !== 'mcq' && <span className="subtype-tag" style={{ marginLeft: 6 }}>
                    {qType === 'fill_blank' ? 'Fill in the Blank' : qType === 'true_false' ? 'True / False' : 'Match the Following'}
                  </span>}
                </p>
                <h2 className="font-display font-bold text-lg leading-snug" style={{ color: 'var(--text)' }}>
                  {qType === 'true_false' ? q.statement : qType === 'fill_blank' ? (q.sentence ?? q.question) : q.question}
                </h2>
              </div>

              {/* ---- MCQ ---- */}
              {qType === 'mcq' && (
                <div className="flex flex-col gap-2.5">
                  {q.options.map((opt, i) => {
                    let cls = 'option-btn';
                    if (revealed) {
                      if (i === q.correctAnswer) cls += ' correct';
                      else if (i === answer) cls += ' wrong';
                    } else if (i === answer) {
                      cls += ' selected';
                    }
                    return (
                      <button key={i} className={cls} onClick={() => !revealed && setAnswer(i)} disabled={revealed}>
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0" style={{ background: 'var(--bg-card-2)', color: 'var(--text-muted)' }}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="flex-1">{opt}</span>
                        {revealed && i === q.correctAnswer && <span className="text-green-600 shrink-0">✓</span>}
                        {revealed && i === answer && i !== q.correctAnswer && <span className="shrink-0" style={{ color: 'var(--red)' }}>✗</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ---- True / False ---- */}
              {qType === 'true_false' && (
                <div className="flex gap-3">
                  {[true, false].map(v => {
                    const isSelected = answer === v;
                    const showCorrect = revealed && v === q.answer;
                    const showWrong = revealed && isSelected && v !== q.answer;
                    return (
                      <button
                        key={String(v)}
                        className="true-false-btn-lg"
                        disabled={revealed}
                        onClick={() => !revealed && setAnswer(v)}
                        style={{
                          borderColor: showCorrect ? '#16a34a' : showWrong ? '#dc2626' : isSelected ? 'var(--primary)' : 'var(--divider)',
                          background: showCorrect ? '#dcfce7' : showWrong ? '#fee2e2' : isSelected ? 'var(--primary-light)' : 'var(--bg-card-2)',
                          color: showCorrect ? '#166534' : showWrong ? '#991b1b' : 'var(--text)',
                          transform: isSelected && !revealed ? 'translateY(-2px)' : 'none',
                        }}
                      >
                        {v ? 'True' : 'False'} {showCorrect ? '✓' : showWrong ? '✗' : ''}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ---- Fill in the Blank (tap a word, no typing) ---- */}
              {qType === 'fill_blank' && (
                <div className="answer-chip-row" style={{ marginTop: 0 }}>
                  {(q.wordBank ?? []).map((word, i) => {
                    const isSelected = answer === word;
                    const showCorrect = revealed && word.trim().toLowerCase() === (q.correctWord ?? '').trim().toLowerCase();
                    const showWrong = revealed && isSelected && !showCorrect;
                    return (
                      <button
                        key={i}
                        disabled={revealed}
                        onClick={() => !revealed && setAnswer(word)}
                        className={`answer-chip${showCorrect ? ' is-correct' : ''}`}
                        style={{
                          borderColor: showWrong ? '#dc2626' : isSelected && !revealed ? 'var(--primary)' : undefined,
                          background: showWrong ? '#fee2e2' : isSelected && !revealed ? 'var(--primary-light)' : undefined,
                          color: showWrong ? '#991b1b' : isSelected && !revealed ? 'var(--primary)' : undefined,
                          fontSize: 14,
                          padding: '8px 16px',
                          cursor: revealed ? 'default' : 'pointer',
                        }}
                      >
                        {word}{showCorrect ? ' ✓' : showWrong ? ' ✗' : ''}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ---- Match the Following ---- */}
              {qType === 'match' && (
                <MatchQuiz
                  left={q.left ?? []}
                  right={q.right ?? []}
                  answerKey={q.answerKey ?? []}
                  revealed={revealed}
                  pairs={(answer as Record<number, number>) ?? {}}
                  onChange={p => setAnswer(p)}
                />
              )}

              {/* Explanation */}
              {revealed && q.explanation && (
                <div className="clay-card p-4 slide-up" style={{ background: 'var(--green-light)', borderColor: '#86efac' }}>
                  <p className="text-xs font-black uppercase tracking-wider text-green-700 mb-1.5">Explanation</p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{q.explanation}</p>
                </div>
              )}
            </div>

            {/* Action */}
            <div className="sticky bottom-4">
              {!revealed ? (
                <button onClick={handleCheck} disabled={!answered} className="clay-btn w-full py-4 text-base">
                  Check Answer
                </button>
              ) : (
                <button onClick={handleNext} className="clay-btn w-full py-4 text-base flex items-center justify-center gap-2">
                  {idx < total - 1 ? 'Next Question' : 'See Results'}
                  <ChevronRight size={18} />
                </button>
              )}
            </div>
          </>
        ) : (
          /* Results */
          <div className="clay-card p-8 flex flex-col items-center text-center gap-4">
            <span className="text-6xl">{emoji}</span>
            <div>
              <div className="font-display font-black text-5xl" style={{ color }}>{grade}</div>
              <div className="text-lg font-bold mt-1" style={{ color: 'var(--text)' }}>{correctCount}/{total} correct · {scorePct}%</div>
            </div>
            <p className="font-semibold" style={{ color: 'var(--text-muted)' }}>{msg}</p>

            {saving && <p className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>Saving score…</p>}
            {!user && <p className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>Sign in to save your score & earn XP!</p>}

            <div className="flex flex-col gap-3 w-full mt-2">
              <button onClick={reset} className="clay-btn-ghost py-3 flex items-center justify-center gap-2">
                <RotateCcw size={16} /> Retry
              </button>
              <Link href={`/notes/${slug}/${chapterId}`}>
                <button className="clay-btn-ghost w-full py-3">Review Notes</button>
              </Link>
              <Link href={`/subject/${slug}`}>
                <button className="clay-btn w-full py-3">Next Chapter →</button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/** Tap-to-pair matching UI used by the "match" quiz subtype. Unlike the
 *  notes version, this one is actually gradeable — it feeds a
 *  `Record<leftIndex, rightIndex>` back up via onChange. */
function MatchQuiz({
  left, right, answerKey, revealed, pairs, onChange,
}: {
  left: string[]; right: string[]; answerKey: number[];
  revealed: boolean; pairs: Record<number, number>; onChange: (p: Record<number, number>) => void;
}) {
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const usedRight = new Set(Object.values(pairs));

  const pickLeft = (i: number) => { if (!revealed) setSelectedLeft(i); };
  const pickRight = (j: number) => {
    if (revealed || selectedLeft === null) return;
    onChange({ ...pairs, [selectedLeft]: j });
    setSelectedLeft(null);
  };

  return (
    <div className="flex gap-3">
      <div className="flex-1 flex flex-col gap-2">
        {left.map((item, i) => {
          const isPaired = pairs[i] !== undefined;
          const isCorrectPair = revealed && pairs[i] === answerKey[i];
          const isWrongPair = revealed && isPaired && pairs[i] !== answerKey[i];
          return (
            <button
              key={i}
              onClick={() => pickLeft(i)}
              disabled={revealed}
              className="text-left text-xs font-semibold px-3 py-2 rounded-xl border-2 transition"
              style={{
                borderColor: isCorrectPair ? '#16a34a' : isWrongPair ? '#dc2626' : selectedLeft === i ? 'var(--primary)' : 'var(--divider)',
                background: selectedLeft === i ? 'var(--primary-light)' : 'var(--bg-card-2)',
                color: 'var(--text)',
              }}
            >
              {i + 1}. {item} {isPaired && <span style={{ color: 'var(--text-muted)' }}>→ {String.fromCharCode(65 + pairs[i])}</span>}
            </button>
          );
        })}
      </div>
      <div className="flex-1 flex flex-col gap-2">
        {right.map((item, j) => (
          <button
            key={j}
            onClick={() => pickRight(j)}
            disabled={revealed || usedRight.has(j)}
            className="text-left text-xs font-semibold px-3 py-2 rounded-xl border-2"
            style={{
              borderColor: usedRight.has(j) ? 'var(--primary-border)' : 'var(--divider)',
              background: usedRight.has(j) ? 'var(--primary-light)' : 'var(--bg-card-2)',
              color: 'var(--text)',
              opacity: revealed ? 0.85 : 1,
            }}
          >
            {String.fromCharCode(65 + j)}. {item}
          </button>
        ))}
      </div>
    </div>
  );
}
