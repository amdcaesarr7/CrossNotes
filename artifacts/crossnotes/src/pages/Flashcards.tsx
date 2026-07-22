import { useState } from 'react';
import { RotateCcw, Loader2 } from 'lucide-react';
import { Link, useParams } from 'wouter';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { markFlashcardsCompleted } from '@/hooks/useFirestore';
import { useStaticSubject, useStaticChapter, useStaticFlashcards } from '@/hooks/useContent';
import { sfx } from '@/lib/sfx';
import { celebrateActivityResult } from '@/lib/celebrate';
import AppHeader from '@/components/AppHeader';
import '../crossnotes.css';

export default function Flashcards() {
  const { isDark } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [confused, setConfused] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [rewarded, setRewarded] = useState(false);

  const params = useParams<{ slug: string; chapterId: string }>();
  const slug      = params.slug || '';
  const chapterId = params.chapterId || '';
  const { user } = useAuth();

  const subject = useStaticSubject(slug);
  const { chapter } = useStaticChapter(slug, chapterId);
  const { flashcards, loading } = useStaticFlashcards(slug, chapterId);

  const colorKey = subject?.color || 'violet';
  const card     = flashcards[currentIndex];
  const total    = flashcards.length;
  const progress = total > 0 ? ((currentIndex) / total) * 100 : 0;

  const handleResult = async (gotIt: boolean) => {
    gotIt ? sfx.correct() : sfx.click();
    if (gotIt) setKnown(k => k + 1); else setConfused(c => c + 1);
    const isLast = currentIndex >= total - 1;
    if (!isLast) {
      setCurrentIndex(i => i + 1);
      setIsFlipped(false);
    } else {
      setIsFinished(true);
      if (user && !rewarded) {
        try {
          const result = await markFlashcardsCompleted(user.uid, chapterId, { subjectSlug: slug, chapterName: chapter?.title });
          setRewarded(true);
          if (result.xp > 0) {
            const boostTag = result.boostMultiplier > 1 ? ` (🧪 ${result.boostMultiplier}x boosted!)` : '';
            toast.success(`+${result.xp} XP · +${result.coinsEarned} coins! Flashcards done 🎯${boostTag}`);
          } else toast('XP already claimed. No farming! 👀');
          celebrateActivityResult(result);
        } catch (err) { console.error(err); }
      }
    }
  };

  const reset = () => { setCurrentIndex(0); setIsFlipped(false); setKnown(0); setConfused(0); setIsFinished(false); };

  return (
    <div className={`cn-body ${isDark ? 'dark-mode' : ''}`}>
      <AppHeader backHref={`/subject/${slug}`} backLabel={subject?.name ?? 'Back'} />

      <main className="immersive-content items-stretch">
        {/* Title */}
        <div>
          <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: 'var(--primary)' }}>
            {subject?.name} · Flashcards
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
            <p className="text-3xl mb-2">🃏</p>
            <p className="font-bold" style={{ color: 'var(--text)' }}>No flashcards yet.</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Add them to <code className="text-xs bg-gray-100 px-1 rounded">{slug}.json</code></p>
            <Link href={`/subject/${slug}`}><button className="clay-btn mt-4">← Back</button></Link>
          </div>
        ) : !isFinished ? (
          <>
            {/* Progress */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                <span>{currentIndex + 1} / {total}</span>
                <span className="text-green-600">{known} ✓</span>
              </div>
              <div className="clay-progress h-2.5">
                <div
                  className="clay-progress-fill"
                  style={{ width: `${progress}%`, background: `var(--${colorKey}-shadow)`, transition: 'width 0.4s ease' }}
                />
              </div>
            </div>

            {/* 3D Flip Card */}
            <div
              className="perspective-1000 cursor-pointer"
              style={{ height: 240 }}
              onClick={() => { sfx.flip(); setIsFlipped(f => !f); }}
            >
              <div
                className="transform-style-3d relative w-full h-full"
                style={{ transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1)', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)' }}
              >
                {/* Front */}
                <div
                  className="backface-hidden absolute inset-0 clay-card flex flex-col items-center justify-center p-6 text-center"
                  style={{ background: `var(--${colorKey}-bg)`, borderColor: `var(--${colorKey}-border)` }}
                >
                  <p className="text-xs font-black uppercase tracking-wider mb-3 opacity-60" style={{ color: `var(--${colorKey}-shadow)` }}>
                    Tap to flip ↩
                  </p>
                  <p className="font-bold text-lg leading-snug" style={{ color: 'var(--text)' }}>{card?.front}</p>
                </div>
                {/* Back */}
                <div
                  className="backface-hidden rotate-y-180 absolute inset-0 clay-card flex flex-col items-center justify-center p-6 text-center"
                  style={{ background: `var(--${colorKey}-bg)`, borderColor: `var(--${colorKey}-border)` }}
                >
                  <p className="text-xs font-black uppercase tracking-wider mb-3 opacity-70" style={{ color: `var(--${colorKey}-shadow)` }}>
                    Answer
                  </p>
                  <p className="font-bold text-lg leading-snug" style={{ color: 'var(--text)' }}>{card?.back}</p>
                </div>
              </div>
            </div>

            <p className="text-center text-sm font-bold" style={{ color: 'var(--text-muted)' }}>
              {isFlipped ? 'How did you do?' : 'Tap the card to reveal the answer'}
            </p>

            {/* Verdict */}
            <div
              className="grid grid-cols-2 gap-3"
              style={{ opacity: isFlipped ? 1 : 0, pointerEvents: isFlipped ? 'auto' : 'none', transform: isFlipped ? 'none' : 'translateY(12px)', transition: 'opacity 0.25s, transform 0.25s' }}
            >
              <button
                onClick={e => { e.stopPropagation(); handleResult(false); }}
                className="clay-btn-ghost py-4 text-sm font-bold"
                style={{ background: 'var(--red-light)', color: 'var(--red)', borderColor: '#fca5a5' }}
              >
                Still confused ✗
              </button>
              <button
                onClick={e => { e.stopPropagation(); handleResult(true); }}
                className="clay-btn-ghost py-4 text-sm font-bold"
                style={{ background: 'var(--green-light)', color: 'var(--green)', borderColor: '#86efac' }}
              >
                Got it! ✓
              </button>
            </div>
          </>
        ) : (
          <div className="clay-card p-8 flex flex-col items-center text-center gap-5">
            <span className="text-6xl">🎯</span>
            <h2 className="font-display font-black text-3xl" style={{ color: 'var(--text)' }}>Session Done!</h2>
            <div className="flex items-center gap-8">
              <div>
                <div className="font-black text-3xl text-green-600">{known}</div>
                <div className="text-xs font-bold mt-0.5" style={{ color: 'var(--text-muted)' }}>Got it</div>
              </div>
              <div className="w-px h-10" style={{ background: 'var(--divider)' }} />
              <div>
                <div className="font-black text-3xl" style={{ color: 'var(--red)' }}>{confused}</div>
                <div className="text-xs font-bold mt-0.5" style={{ color: 'var(--text-muted)' }}>Confused</div>
              </div>
            </div>
            {!user && <p className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>Sign in to save your +20 XP!</p>}
            <div className="flex flex-col gap-3 w-full mt-2">
              <button onClick={reset} className="clay-btn-ghost py-3 flex items-center justify-center gap-2">
                <RotateCcw size={16} /> Redo
              </button>
              <Link href={`/quiz/${slug}/${chapterId}`}>
                <button className="clay-btn w-full py-3">Take the Quiz →</button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
