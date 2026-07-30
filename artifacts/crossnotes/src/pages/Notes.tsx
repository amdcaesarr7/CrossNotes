import { useState } from 'react';
import { Loader2, CheckCircle2, LayoutList, FileText, PenSquare, Shuffle, ToggleLeft, HelpCircle } from 'lucide-react';
import { Link, useParams } from 'wouter';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { claySpringConfig } from '@/lib/animations';
import { useMotion } from '@/hooks/useMotion';
import { markNotesRead } from '@/hooks/useFirestore';
import { useStaticSubject, useStaticChapter, useStaticNotes } from '@/hooks/useContent';
import { celebrateActivityResult } from '@/lib/celebrate';
import NoteBlockRenderer from '@/components/NoteBlockRenderer';
import AppHeader from '@/components/AppHeader';
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

export default function Notes() {
  const { isDark, prefersReducedMotion } = useTheme();
  const { getVariants } = useMotion();
  const [marked, setMarked] = useState(false);
  const [marking, setMarking] = useState(false);

  const params = useParams<{ slug: string; chapterId: string }>();
  const slug      = params.slug || '';
  const chapterId = params.chapterId || '';
  const { user } = useAuth();

  const subject = useStaticSubject(slug);
  const { chapter } = useStaticChapter(slug, chapterId);
  const { notes, loading } = useStaticNotes(slug, chapterId);

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
  const subtypesPresent = Array.from(new Set(notes.map(n => n.type).filter((t): t is string => !!t && t in SUBTYPE_META)));

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
          {subtypesPresent.length > 0 && (
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
          <div className="flex-1 flex items-center justify-center py-20">
            <Loader2 size={30} style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
          </div>
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
            <motion.div
              initial={!prefersReducedMotion ? { opacity: 0 } : {}}
              animate={!prefersReducedMotion ? { opacity: 1 } : {}}
              transition={!prefersReducedMotion ? { staggerChildren: 0.06, delayChildren: 0 } : {}}
            >
              {notes.map((note, i) => (
                <motion.div
                  key={note.id}
                  initial={!prefersReducedMotion ? { opacity: 0, y: 12 } : {}}
                  animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
                  transition={!prefersReducedMotion ? { duration: 0.35, ease: 'easeOut' } : {}}
                >
                  <NoteBlockRenderer note={note} index={i} />
                </motion.div>
              ))}
            </motion.div>

            {/* Next steps */}
            <motion.div
              className="clay-card p-4 flex flex-col gap-3"
              initial={!prefersReducedMotion ? { opacity: 0, y: 12 } : {}}
              animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
              transition={!prefersReducedMotion ? { delay: 0.1 + notes.length * 0.06, duration: 0.35 } : {}}
            >
              <p className="font-display font-bold text-base" style={{ color: 'var(--text)' }}>{isPaper ? 'Reviewed the paper?' : 'Finished reading?'}</p>
              <div className="flex gap-2">
                <Link href={`/flashcards/${slug}/${chapterId}`} className="flex-1">
                  <motion.button
                    className="clay-btn-ghost w-full text-sm py-2.5"
                    whileTap={!prefersReducedMotion ? { scale: 0.95 } : {}}
                    transition={!prefersReducedMotion ? { duration: 0.1 } : {}}
                  >
                    🃏 Flashcards
                  </motion.button>
                </Link>
                <Link href={`/quiz/${slug}/${chapterId}`} className="flex-1">
                  <motion.button
                    className="clay-btn w-full text-sm py-2.5 flex items-center gap-1.5 justify-center"
                    whileTap={!prefersReducedMotion ? { scale: 0.95 } : {}}
                    transition={!prefersReducedMotion ? { duration: 0.1 } : {}}
                  >
                    <LayoutList size={15} /> Quiz
                  </motion.button>
                </Link>
              </div>
            </motion.div>

            {/* Mark as read — sticky */}
            <motion.div
              className="sticky bottom-4"
              initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : {}}
              animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
              transition={!prefersReducedMotion ? { delay: 0.15 + notes.length * 0.06, duration: 0.35, ...claySpringConfig } : {}}
            >
              <motion.button
                onClick={handleMark}
                disabled={marked || marking}
                className="clay-btn w-full py-4 text-base flex items-center justify-center gap-2"
                style={marked ? { background: '#15803d', boxShadow: '0 3px 0 rgba(0,0,0,0.25)' } : {}}
                whileTap={!prefersReducedMotion && !marked ? { scale: 0.95 } : {}}
                transition={!prefersReducedMotion ? { duration: 0.1 } : {}}
              >
                {marking
                  ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  : marked
                  ? <><CheckCircle2 size={18} /> Done! +10 XP earned</>
                  : <><CheckCircle2 size={18} /> Mark as Read · +10 XP</>
                }
              </motion.button>
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
}
