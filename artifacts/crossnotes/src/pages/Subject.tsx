import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useParams } from 'wouter';
import { BookOpen, Layers, LayoutList, Loader2, AlertTriangle, ChevronRight, X, Sparkles, FileText } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProgress } from '@/hooks/useFirestore';
import { useStaticSubject, useStaticChapters, type StaticChapter } from '@/hooks/useContent';
import AppHeader from '@/components/AppHeader';
import BottomNav from '@/components/BottomNav';
import '../crossnotes.css';

function chapterStatus(p: { notesRead?: boolean; flashcardsCompleted?: boolean; quizCompleted?: boolean; quizPct?: number } | null) {
  if (!p) return 'not_started';
  if (p.notesRead && p.flashcardsCompleted && p.quizCompleted) return (p.quizPct ?? 100) < 70 ? 'needs_revision' : 'done';
  if (p.notesRead || p.flashcardsCompleted || p.quizCompleted) return 'in_progress';
  return 'not_started';
}

/** Short "what you'll learn" popup — deliberately NOT a full page. Opens with
 *  a scale-up "pop" so it visibly grows into place instead of just appearing. */
function ChapterOverviewSheet({ chapter, slug, onClose }: { chapter: StaticChapter; slug: string; onClose: () => void }) {
  const overview = chapter.overview;
  const { isDark } = useTheme();

  // Rendered via portal straight into <body>. The trigger card (.chapter-row)
  // animates with a CSS `transform` on hover/tap, and any ancestor with a
  // transform becomes the containing block for `position: fixed` children —
  // which was trapping this "full-screen" sheet inside the little card
  // instead of the viewport. Portalling out of the DOM tree sidesteps that
  // entirely, regardless of what CSS the card ends up with.
  //
  // Because this lives outside .cn-body in the DOM, it can't inherit the
  // --bg-card/--text/etc theme variables defined there — var(--bg-card)
  // was resolving to nothing, so the sheet's background was broken in both
  // themes. .overview-backdrop now carries its own copy of those variables
  // (see crossnotes.css), toggled with this same isDark flag from context
  // (React context works across portals even though the DOM doesn't).
  return createPortal(
    <div className={`overview-backdrop ${isDark ? 'dark-mode' : ''}`} onClick={onClose}>
      <div className="overview-sheet sheet-pop" onClick={(e) => e.stopPropagation()}>
        <div className="overview-sheet-handle" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-3xl shrink-0">{chapter.emoji || '📘'}</span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Chapter {chapter.num}</p>
              <h2 className="font-display font-black text-lg leading-tight" style={{ color: 'var(--text)' }}>{chapter.title}</h2>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="shrink-0 p-1" style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {overview?.summary ? (
          <p className="text-sm mt-4 leading-relaxed" style={{ color: 'var(--text)' }}>{overview.summary}</p>
        ) : (
          <p className="text-sm mt-4 italic" style={{ color: 'var(--text-muted)' }}>No summary yet for this chapter — but the notes, flashcards, and quiz below are all ready.</p>
        )}

        {overview?.youWillLearn && overview.youWillLearn.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wide mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <Sparkles size={12} /> What you'll learn
            </p>
            <ul className="flex flex-col gap-1.5">
              {overview.youWillLearn.map((point, i) => (
                <li key={i} className="text-sm flex items-start gap-2" style={{ color: 'var(--text)' }}>
                  <span className="shrink-0" style={{ color: 'var(--primary)' }}>✓</span> {point}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-2 mt-6">
          <Link href={`/notes/${slug}/${chapter.id}`} className="flex-1">
            <button className="clay-btn py-3.5 w-full flex flex-col items-center gap-1 text-xs">
              {chapter.kind === 'paper' ? <FileText size={18} /> : <BookOpen size={18} />} {chapter.kind === 'paper' ? 'Paper' : 'Notes'}
            </button>
          </Link>
          <Link href={`/flashcards/${slug}/${chapter.id}`} className="flex-1">
            <button className="clay-btn py-3.5 w-full flex flex-col items-center gap-1 text-xs">
              <Layers size={18} /> Cards
            </button>
          </Link>
          <Link href={`/quiz/${slug}/${chapter.id}`} className="flex-1">
            <button className="clay-btn py-3.5 w-full flex flex-col items-center gap-1 text-xs">
              <LayoutList size={18} /> Quiz
            </button>
          </Link>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ChapterRow({ chapter, slug, uid }: { chapter: StaticChapter; slug: string; uid?: string }) {
  const { progress } = useUserProgress(uid, chapter.id);
  const status = chapterStatus(progress);
  const hasContent = chapter.notes.length > 0 || chapter.flashcards.length > 0 || chapter.quiz.length > 0;
  const [showOverview, setShowOverview] = useState(false);

  const emojiOrNum = chapter.emoji || `${chapter.num}`;

  return (
    <div
      className="chapter-row"
      style={hasContent ? { cursor: 'pointer' } : undefined}
      role={hasContent ? 'button' : undefined}
      tabIndex={hasContent ? 0 : undefined}
      onClick={() => hasContent && setShowOverview(true)}
      onKeyDown={(e) => { if (hasContent && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setShowOverview(true); } }}
    >
      <div className="flex items-center gap-3">
        {/* Chapter number/emoji badge */}
        <div
          className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center font-display font-black text-lg border-2"
          style={
            status === 'done' ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }
            : status === 'needs_revision' ? { background: '#fef3c7', color: '#92400e', borderColor: '#fcd34d' }
            : status === 'in_progress' ? { background: 'var(--primary-light)', color: 'var(--primary)', borderColor: 'var(--primary-border)' }
            : { background: 'var(--bg-card-2)', color: 'var(--text-muted)', borderColor: 'var(--divider)' }
          }
        >
          {emojiOrNum}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm leading-snug truncate" style={{ color: 'var(--text)' }}>{chapter.title}</h3>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {status === 'done' && <span className="badge badge-done">✓ Done</span>}
            {status === 'needs_revision' && <span className="badge badge-revision">⚠ Revise</span>}
            {status === 'in_progress' && <span className="badge badge-progress">▶ In Progress</span>}
            {status === 'not_started' && !hasContent && <span className="badge badge-new">🔒 Coming soon</span>}
            {status === 'not_started' && hasContent && <span className="badge badge-new">New</span>}
            {progress?.quizPct !== undefined && (
              <span className="badge" style={progress.quizPct < 70 ? { background: '#fee2e2', color: '#b91c1c', borderColor: '#fca5a5' } : { background: 'var(--bg-card-2)', color: 'var(--text-muted)', borderColor: 'var(--divider)' }}>
                {progress.quizPct}%
              </span>
            )}
          </div>
        </div>

        {/* Hints that the whole card is tappable — most people tap the row itself,
            not the small buttons below, so give that a visible affordance */}
        {hasContent && <ChevronRight size={18} className="shrink-0" style={{ color: 'var(--text-muted)' }} />}
      </div>

      {/* Action buttons — still here as a direct shortcut for anyone who wants
          to skip straight to one, bypassing the overview popup. stopPropagation
          so tapping a button doesn't ALSO open the overview underneath it. */}
      {hasContent && (
        <div className="chapter-actions" onClick={(e) => e.stopPropagation()}>
          <Link href={`/notes/${slug}/${chapter.id}`} className="chapter-actions-link">
            <button className="clay-btn-ghost chapter-actions-btn">
              {chapter.kind === 'paper' ? <FileText size={14} /> : <BookOpen size={14} />} {chapter.kind === 'paper' ? 'Paper' : 'Notes'}
            </button>
          </Link>
          <Link href={`/flashcards/${slug}/${chapter.id}`} className="chapter-actions-link">
            <button className="clay-btn-ghost chapter-actions-btn">
              <Layers size={14} /> Cards
            </button>
          </Link>
          <Link href={`/quiz/${slug}/${chapter.id}`} className="chapter-actions-link">
            <button
              className="clay-btn-ghost chapter-actions-btn"
              style={status !== 'done' ? { background: 'var(--primary-light)', borderColor: 'var(--primary-border)', color: 'var(--primary)' } : {}}
            >
              <LayoutList size={14} /> Quiz
            </button>
          </Link>
        </div>
      )}

      {showOverview && (
        <ChapterOverviewSheet chapter={chapter} slug={slug} onClose={() => setShowOverview(false)} />
      )}
    </div>
  );
}

export default function Subject() {
  const { isDark } = useTheme();
  const params = useParams<{ slug: string }>();
  const slug = params.slug || '';
  const { user } = useAuth();

  const subject = useStaticSubject(slug);
  const { chapters, loading } = useStaticChapters(slug);

  if (!subject) {
    return (
      <div className={`cn-body ${isDark ? 'dark-mode' : ''}`}>
        <AppHeader backHref="/subjects" backLabel="Subjects" />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center pb-24">
          <p className="text-5xl">😵</p>
          <h2 className="font-display font-bold text-xl" style={{ color: 'var(--text)' }}>Subject not found</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>There's no subject called "{slug}".</p>
          <Link href="/subjects"><button className="clay-btn">← Back to Subjects</button></Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  const colorKey = subject.color || 'violet';

  return (
    <div className={`cn-body ${isDark ? 'dark-mode' : ''}`}>
      <AppHeader backHref="/subjects" backLabel="Subjects" />

      <main className="page-content" style={{ maxWidth: 680 }}>
        {/* Subject hero */}
        <div
          className="clay-card p-5 flex items-center gap-4"
          style={{ background: `var(--${colorKey}-bg)`, borderColor: `var(--${colorKey}-border)` }}
        >
          <span className="text-5xl">{subject.emoji}</span>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-black text-xl leading-tight" style={{ color: 'var(--text)' }}>{subject.name}</h1>
            {subject.description && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{subject.description}</p>}
            <div className="flex items-center gap-2 mt-2">
              <span className="badge badge-new">{chapters.length} chapters</span>
              {!subject.isLive && <span className="badge badge-revision">🔒 Coming soon</span>}
            </div>
          </div>
        </div>

        {!subject.isLive && (
          <div className="clay-card p-4 flex items-start gap-3" style={{ background: '#fef3c7', borderColor: '#fcd34d' }}>
            <AlertTriangle size={18} style={{ color: '#92400e', flexShrink: 0, marginTop: 1 }} />
            <p className="text-sm font-semibold" style={{ color: '#92400e' }}>
              Content for this subject is still being added. Stay tuned!
            </p>
          </div>
        )}

        {/* Question Papers — kept separate from regular study chapters */}
        {(() => {
          const papers = chapters.filter(ch => ch.kind === 'paper');
          const regular = chapters.filter(ch => ch.kind !== 'paper');
          return (
            <>
              {!loading && papers.length > 0 && (
                <section>
                  <h2 className="section-header mb-3">📄 Question Papers</h2>
                  <div className="flex flex-col gap-3">
                    {papers.map(ch => (
                      <ChapterRow key={ch.id} chapter={ch} slug={slug} uid={user?.uid} />
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h2 className="section-header mb-3">Chapters</h2>
                {loading ? (
                  <div className="flex flex-col gap-3">
                    {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: 'var(--bg-card-2)' }} />)}
                  </div>
                ) : regular.length === 0 ? (
                  <div className="clay-card p-8 text-center" style={{ color: 'var(--text-muted)' }}>
                    <p className="text-3xl mb-2">😴</p>
                    <p className="font-bold">No chapters yet. He just had One J*b</p>
                    <p className="text-sm mt-1">Drop a <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{slug}.json</code> into <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">src/data/content/</code></p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {regular.map(ch => (
                      <ChapterRow key={ch.id} chapter={ch} slug={slug} uid={user?.uid} />
                    ))}
                  </div>
                )}
              </section>
            </>
          );
        })()}
      </main>

      <BottomNav />
    </div>
  );
}
