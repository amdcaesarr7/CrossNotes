import { useState, useMemo, useEffect } from 'react';
import { Loader2, CheckCircle2, LayoutList, FileText, PenSquare, Shuffle, ToggleLeft, HelpCircle, Sparkles, Target } from 'lucide-react';
import { Link, useParams } from 'wouter';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { markNotesRead } from '@/hooks/useFirestore';
import { useStaticSubject, useStaticChapter, useStaticNotes } from '@/hooks/useContent';
import { useHead, useBreadcrumb, getChapterMeta } from '@/hooks/useSeo';
import { celebrateActivityResult } from '@/lib/celebrate';
import NoteBlockRenderer from '@/components/NoteBlockRenderer';
import { ContentSkeleton } from '@/components/StudySkeleton';
import MathsPracticeLibrary from '@/components/MathsPracticeLibrary';
import { isImportedSolution } from '@/lib/importedSolutions';
import AppHeader from '@/components/AppHeader';
import MewMascot from '@/components/MewMascot';
import '../crossnotes.css';

// Subtype tags shown under the chapter title, pulled straight from the
// note "type" values present in the JSON for this chapter — no hardcoding.
const SUBTYPE_META: Record<string, { label: string; icon: typeof PenSquare }> = {
  fill_blank:   { label: 'Fill in the Blanks',   icon: PenSquare },
  match_column: { label: 'Match the Following',  icon: Shuffle },
  true_false:   { label: 'True or False',        icon: ToggleLeft },
  qna:          { label: 'Q & A',                icon: HelpCircle },
  table:        { label: 'Tables',               icon: LayoutList },
  rules:        { label: 'Official Rules',       icon: FileText },
};

const PEEP_SPEECHES = [
  "Pssst... still reading or did you fall asleep? 😴",
  "This section is actually on the board exam. Lock in! 🧠",
  "Don't skip the diagram! Teachers love diagrams. 📐",
  "Mew is impressed by your focus. Keep grinding! 🔥",
  "Remember: understanding > rote memorization! 💡",
];

function PeepingMew() {
  const [visible, setVisible] = useState(false);
  const [speechIdx, setSpeechIdx] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSpeechIdx(Math.floor(Math.random() * PEEP_SPEECHES.length));
      setVisible(true);
    }, 4500);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-20 right-4 z-50 flex items-end gap-2"
      style={{ animation: 'mewSlideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
    >
      <div className="relative">
        <button
          onClick={() => setVisible(false)}
          className="absolute -top-2 -right-2 bg-gray-200 text-gray-700 rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold z-10 hover:bg-gray-300"
          aria-label="Dismiss mascot note"
        >
          ×
        </button>
        <MewMascot
          size="sm"
          mood="studying"
          speech={PEEP_SPEECHES[speechIdx]}
        />
      </div>
    </div>
  );
}

export default function Notes() {
  const { isDark } = useTheme();
  const [marked, setMarked] = useState(false);
  const [marking, setMarking] = useState(false);

  const params = useParams<{ slug: string; chapterId: string }>();
  const slug      = params.slug || '';
  const chapterId = params.chapterId || '';
  const { user } = useAuth();

  const subject = useStaticSubject(slug);
  const { chapter, loading: chapterLoading } = useStaticChapter(slug, chapterId);
  const { notes, loading: notesLoading } = useStaticNotes(slug, chapterId);
  const loading = notesLoading || chapterLoading;
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: subject?.name ?? 'Subjects', url: `/subjects` },
    { name: chapter?.title ?? 'Chapter', url: `/subject/${slug}` },
    { name: `${chapter?.title} Notes`, url: window.location.href },
  ];

  useHead(getChapterMeta({ name: subject?.name ?? '' }, chapter ?? { title: 'Loading...' }, 'notes', `/notes/${slug}/${chapterId}`));
  useBreadcrumb(breadcrumbs);

  const handleMark = async () => {
    if (!user) { toast.error('Sign in first to earn XP!'); return; }
    if (marked) return;
    setMarking(true);
    try {
      const result = await markNotesRead(user.uid, chapterId, { subjectSlug: slug, chapterName: chapter?.title });
      setMarked(true);
      if (result.xp > 0) {
        const boostTag = result.boostMultiplier > 1 ? ` (🧪 ${result.boostMultiplier}x boosted!)` : '';
        toast.success(`+${result.xp} XP · +${result.coinsEarned} coins! Notes locked in. 🧠${boostTag}`);
      } else toast('Already done! No double XP. 👀');
      celebrateActivityResult(result);
    } catch { toast.error('Something went wrong. Try again?'); }
    finally { setMarking(false); }
  };

  const isPaper = chapter?.kind === 'paper';
  const mathsSolutionNotes = notes.filter(isImportedSolution);
  const isSolutionLibrary = mathsSolutionNotes.length > 0;
  const isMathsPracticeLibrary = /^maths-[12]$/.test(slug) && mathsSolutionNotes.length > 0;
  const hasFlashcards = (chapter?.flashcards.length ?? 0) > 0;
  const hasQuiz = (chapter?.quiz.length ?? 0) > 0;
  const subtypesPresent = Array.from(new Set(notes.map(n => n.type).filter((t): t is Exclude<typeof t, undefined> => !!t && t in SUBTYPE_META)));

  return (
    <div className={`cn-body ${isDark ? 'dark-mode' : ''}`}>
      <AppHeader backHref={`/subject/${slug}`} backLabel={subject?.name ?? 'Back'} />

      <main className="immersive-content">
        {/* Chapter title */}
        <div>
          <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: 'var(--primary)' }}>
            {subject?.name} · {isPaper ? 'Question Paper' : 'Notes'}
          </p>
          <h1 className="font-display font-black text-xl leading-tight" style={{ color: 'var(--text)' }}>
            {chapter?.title ?? 'Loading…'}
          </h1>
          {isMathsPracticeLibrary ? (
            <div className="solution-study-strip" aria-label={`${mathsSolutionNotes.length} Maths Practice and Problem Sets`}>
              <span className="solution-study-icon"><Sparkles size={15} /></span>
              <span><strong>{mathsSolutionNotes.length}</strong> Practice & Problem Sets</span>
              <span className="solution-study-divider" />
              <span className="solution-study-meta"><Target size={13} /> Search + focused pages</span>
            </div>
          ) : isSolutionLibrary ? (
            <div className="solution-study-strip" aria-label={`${notes.length} worked solution sets`}>
              <span className="solution-study-icon"><Sparkles size={15} /></span>
              <span><strong>{notes.length}</strong> worked solution sets</span>
              <span className="solution-study-divider" />
              <span className="solution-study-meta"><Target size={13} /> Questions + methods</span>
            </div>
          ) : subtypesPresent.length > 0 && (
            <div className="subtype-tag-row">
              {subtypesPresent.map(t => {
                const meta = SUBTYPE_META[t];
                const Icon = meta.icon;
                return (
                  <span key={t} className="subtype-tag">
                    <Icon size={12} /> {meta.label}
                  </span>
                );
              })}
            </div>
          )}

        </div>

        {loading ? (
          <ContentSkeleton count={4} />
        ) : notes.length === 0 ? (
          <div className="clay-card p-8 text-center">
            <p className="text-3xl mb-2">📭</p>
            <p className="font-bold" style={{ color: 'var(--text)' }}>No notes yet.</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Add notes to this chapter in <code className="text-xs bg-gray-100 px-1 rounded">{slug}.json</code>
            </p>
          </div>
        ) : (
          <>
            {isMathsPracticeLibrary ? (
              <MathsPracticeLibrary notes={mathsSolutionNotes} chapterTitle={chapter?.title ?? 'Maths chapter'} />
            ) : (
              notes.map((note, i) => (
                <NoteBlockRenderer key={note.id} note={note} index={i} />
              ))
            )}

            {/* Next steps — only show real study modes that actually contain content. */}
            {(hasFlashcards || hasQuiz) && (
              <div className="clay-card p-4 flex flex-col gap-3">
                <p className="font-display font-bold text-base" style={{ color: 'var(--text)' }}>{isPaper ? 'Reviewed the paper?' : 'Ready for recall?'}</p>
                <div className="flex gap-2">
                  {hasFlashcards && (
                    <Link href={`/flashcards/${slug}/${chapterId}`} className="flex-1">
                      <button className="clay-btn-ghost w-full text-sm py-2.5">🃏 Flashcards</button>
                    </Link>
                  )}
                  {hasQuiz && (
                    <Link href={`/quiz/${slug}/${chapterId}`} className="flex-1">
                      <button className="clay-btn w-full text-sm py-2.5 flex items-center gap-1.5 justify-center">
                        <LayoutList size={15} /> Quiz
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Mark as read — sticky */}
            <div className="sticky bottom-4">
              <button
                onClick={handleMark}
                disabled={marked || marking}
                className="clay-btn w-full py-4 text-base flex items-center justify-center gap-2"
                style={marked ? { background: '#15803d', boxShadow: '0 3px 0 rgba(0,0,0,0.25)' } : {}}
              >
                {marking
                  ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  : marked
                  ? <><CheckCircle2 size={18} /> Locked in! +10 XP earned</>
                  : <><CheckCircle2 size={18} /> {isMathsPracticeLibrary ? 'Finish chapter library' : isSolutionLibrary ? 'Finish this solution set' : 'Mark as Read'} · +10 XP</>
                }
              </button>
            </div>
          </>
        )}
      </main>

      <PeepingMew />
    </div>
  );
}
