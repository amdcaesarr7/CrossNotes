import { Link } from 'wouter';
import { Trophy, Target, Flame, Zap, BookOpen, Layers, LogIn, Snowflake } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile, useAllUserProgress, getLevel, MAX_STREAK_FREEZES } from '@/hooks/useFirestore';
import AppHeader from '@/components/AppHeader';
import BottomNav from '@/components/BottomNav';
import '../crossnotes.css';

export default function Progress() {
  const { isDark } = useTheme();
  const { user, signInWithGoogle } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile(user?.uid);
  const { progressMap, loading: progressLoading } = useAllUserProgress(user?.uid);

  const loading = profileLoading || progressLoading;
  const xp     = profile?.xp ?? 0;
  const streak = profile?.streak ?? 0;
  const streakFreezes = profile?.streakFreezes ?? 0;
  const { level, levelName, nextXp } = getLevel(xp);
  const xpPct  = nextXp > 0 ? Math.min(100, Math.round((xp / nextXp) * 100)) : 100;

  const completedChapters = Object.values(progressMap).filter(p => p.notesRead && p.flashcardsCompleted && p.quizCompleted).length;
  const revisionChapters  = Object.values(progressMap).filter(p => p.quizCompleted && (p.quizPct ?? 100) < 70).length;
  const inProgressChapters = Object.values(progressMap).filter(p => (p.notesRead || p.flashcardsCompleted || p.quizCompleted) && !p.quizCompleted).length;

  const weakChapters = Object.entries(progressMap)
    .filter(([, p]) => p.quizCompleted && (p.quizPct ?? 100) < 70 && !!p.subjectSlug)
    .sort(([, a], [, b]) => (a.quizPct ?? 0) - (b.quizPct ?? 0))
    .slice(0, 3);

  return (
    <div className={`cn-body ${isDark ? 'dark-mode' : ''}`}>
      <AppHeader title="My Progress" />

      <main className="page-content">
        {!user ? (
          <div className="clay-card p-10 flex flex-col items-center text-center gap-4">
            <p className="text-5xl">🔐</p>
            <h2 className="font-display font-bold text-xl" style={{ color: 'var(--text)' }}>Sign in to track progress</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Your XP, streak and chapter history all live here.</p>
            <button onClick={signInWithGoogle} className="clay-btn flex items-center gap-2">
              <LogIn size={16} /> Sign in with Google
            </button>
          </div>
        ) : loading ? (
          <div className="flex flex-col gap-4">
            {[1,2,3].map(i => <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: 'var(--bg-card-2)' }} />)}
          </div>
        ) : (
          <>
            {/* XP / Level card */}
            <div className="clay-card p-5 flex flex-col gap-4" style={{ background: 'var(--gold-light)', borderColor: 'var(--gold-border)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-14 h-14 rounded-full flex flex-col items-center justify-center font-display font-black border-2"
                    style={{ background: 'var(--bg-card)', borderColor: '#fb923c', boxShadow: '0 2px 12px rgba(249,115,22,0.2)' }}
                  >
                    <span className="text-xs font-black text-orange-600 uppercase tracking-tight">Lv</span>
                    <span className="text-2xl leading-none" style={{ color: 'var(--text)' }}>{level}</span>
                  </div>
                  <div>
                    <div className="font-display font-bold text-lg" style={{ color: 'var(--text)' }}>{levelName}</div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>{xp} XP · Next: {nextXp} XP</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: '#fff7ed', border: '1.5px solid #fed7aa' }}>
                  <span className="font-black text-lg" style={{ color: '#c2410c' }}>{streak}</span>
                  <span className="streak-fire text-lg">🔥</span>
                  {streakFreezes > 0 && (
                    <span className="flex items-center gap-0.5 ml-1 pl-1.5" style={{ borderLeft: '1.5px solid #fed7aa', color: '#0284c7' }} title={`${streakFreezes} of ${MAX_STREAK_FREEZES} streak freezes banked`}>
                      <Snowflake size={13} /> <span className="text-sm font-black">{streakFreezes}</span>
                    </span>
                  )}
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-1" style={{ color: 'var(--text-muted)' }}>
                  <span>{xp} XP</span><span>{nextXp} XP</span>
                </div>
                <div className="clay-progress h-3.5">
                  <div className="clay-progress-fill xp-bar" style={{ width: `${xpPct}%` }} />
                </div>
              </div>
            </div>

            {/* Stats strip */}
            <div className="stats-strip">
              <div className="stat-card">
                <div className="font-display font-black text-2xl" style={{ color: 'var(--primary)' }}>{completedChapters}</div>
                <div className="text-xs font-bold mt-0.5" style={{ color: 'var(--text-muted)' }}>Completed</div>
              </div>
              <div className="stat-card">
                <div className="font-display font-black text-2xl text-amber-500">{revisionChapters}</div>
                <div className="text-xs font-bold mt-0.5" style={{ color: 'var(--text-muted)' }}>Need Revision</div>
              </div>
              <div className="stat-card">
                <div className="font-display font-black text-2xl text-blue-500">{inProgressChapters}</div>
                <div className="text-xs font-bold mt-0.5" style={{ color: 'var(--text-muted)' }}>In Progress</div>
              </div>
            </div>

            {/* Weak chapters */}
            {weakChapters.length > 0 && (
              <section>
                <h2 className="section-header mb-3">🎯 Revise These</h2>
                <div className="flex flex-col gap-3">
                  {weakChapters.map(([chapterId, p]) => (
                    <div key={chapterId} className="clay-card p-4" style={{ borderColor: '#fcd34d', background: 'var(--gold-light)' }}>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="text-xs font-black uppercase tracking-wider" style={{ color: '#92400e' }}>
                            {p.subjectSlug?.replace(/-/g, ' ')}
                          </p>
                          <p className="font-bold text-sm mt-0.5" style={{ color: 'var(--text)' }}>{p.chapterName ?? `Chapter ${chapterId}`}</p>
                        </div>
                        <span className="badge" style={{ background: '#fee2e2', color: '#b91c1c', borderColor: '#fca5a5', flexShrink: 0 }}>
                          {p.quizPct}%
                        </span>
                      </div>
                      <Link href={`/notes/${p.subjectSlug}/${chapterId}`}>
                        <button className="clay-btn-ghost w-full text-sm py-2.5">📖 Revise Now</button>
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {weakChapters.length === 0 && completedChapters > 0 && (
              <div className="clay-card p-6 text-center">
                <p className="text-3xl mb-2">🎉</p>
                <p className="font-bold" style={{ color: 'var(--text)' }}>No weak chapters!</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>You're crushing it. Keep the streak alive.</p>
              </div>
            )}

            {/* Earn XP guide */}
            <section>
              <h2 className="section-header mb-3">How to Earn XP</h2>
              <div className="clay-card divide-y" style={{ '--tw-divide-opacity': 1 } as any}>
                {[
                  { icon: <BookOpen size={18} style={{ color: 'var(--primary)' }} />, label: 'Read Notes', sub: 'Per chapter, first time only', xp: '+10' },
                  { icon: <Layers size={18} style={{ color: '#2563eb' }} />, label: 'Complete Flashcards', sub: 'Per chapter, first time only', xp: '+20' },
                  { icon: <Zap size={18} style={{ color: '#d97706' }} />, label: 'Quiz — Ace it (≥90%)', sub: 'First attempt only', xp: '+50' },
                  { icon: <Flame size={18} style={{ color: '#ea580c' }} />, label: 'Daily Streak', sub: 'Study every single day', xp: '🔥' },
                ].map(({ icon, label, sub, xp: xpVal }) => (
                  <div key={label} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      {icon}
                      <div>
                        <div className="font-bold text-sm" style={{ color: 'var(--text)' }}>{label}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</div>
                      </div>
                    </div>
                    <span className="xp-chip">{xpVal}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Quick links */}
            <div className="grid grid-cols-2 gap-3">
              <Link href="/subjects">
                <div className="clay-card hoverable p-4 flex flex-col items-center gap-2 text-center cursor-pointer">
                  <BookOpen size={22} style={{ color: 'var(--primary)' }} />
                  <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>Subjects</span>
                </div>
              </Link>
              <Link href="/leaderboard">
                <div className="clay-card hoverable p-4 flex flex-col items-center gap-2 text-center cursor-pointer">
                  <Trophy size={22} style={{ color: 'var(--gold)' }} />
                  <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>Leaderboard</span>
                </div>
              </Link>
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
