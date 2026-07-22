import { useState } from 'react';
import { Link } from 'wouter';
import { BookOpen, Flame, Trophy, Target, Zap, ChevronRight, LogIn, Star, Snowflake, BellRing, X, Coins } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useUserProfile, useAllUserProgress, useLeaderboard, getLevel, MAX_STREAK_FREEZES } from '@/hooks/useFirestore';
import { getPotion } from '@/data/potions';
import PotionIcon from '@/components/PotionIcon';
import { useStaticSubjects } from '@/hooks/useContent';
import { useStudyReminder } from '@/hooks/useStudyReminder';
import { isNotificationSupported, getReminderPreference, requestReminderPermission } from '@/lib/notifications';
import AppHeader from '@/components/AppHeader';
import BottomNav from '@/components/BottomNav';
import '../crossnotes.css';

const MOTIVATIONAL = [
  "Your competition is doing nothing. Don't let them win. 😤",
  "One chapter closer to topping the boards. Let's go. 🔥",
  "Your future self is watching. Make them proud. 🎯",
  "Science is just nature's gossip. Read it. 🧬",
  "Every XP is a step away from exam panic. 📚",
  "Duolingo owl is literally crying rn. Study. 🦉",
  "Today's grind = tomorrow's mark sheet. 💯",
];

function todayMsg() {
  return MOTIVATIONAL[new Date().getDay() % MOTIVATIONAL.length];
}

function isToday(timestamp: unknown) {
  if (!timestamp) return false;
  const d = timestamp instanceof Date ? timestamp : new Date((timestamp as any).seconds ? (timestamp as any).seconds * 1000 : timestamp as any);
  const now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export default function Dashboard() {
  const { isDark } = useTheme();
  const { user, signInWithGoogle } = useAuth();
  const subjects = useStaticSubjects();
  const { profile, loading: profileLoading } = useUserProfile(user?.uid);
  const { progressMap, loading: progressLoading } = useAllUserProgress(user?.uid);
  const { entries: leaderboard } = useLeaderboard();

  const xp       = profile?.xp ?? 0;
  const streak   = profile?.streak ?? 0;
  const streakFreezes = profile?.streakFreezes ?? 0;
  const coins    = profile?.coins ?? 0;
  const activeBoost = profile?.activeBoost;
  const boostActive = !!activeBoost && activeBoost.expiresAt.toDate().getTime() > Date.now();
  const activeBoostPotion = boostActive ? getPotion(activeBoost!.potionId) : undefined;
  const { level, levelName, nextXp } = getLevel(xp);
  const xpPct    = nextXp > 0 ? Math.min(100, Math.round((xp / nextXp) * 100)) : 100;
  const studiedToday = isToday(profile?.lastStudied);

  useStudyReminder(studiedToday);
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    try { return localStorage.getItem('cn-reminder-banner-dismissed') === 'true'; } catch { return false; }
  });
  const showReminderBanner = !!user && isNotificationSupported() && !getReminderPreference() && !bannerDismissed;
  const dismissBanner = () => {
    setBannerDismissed(true);
    try { localStorage.setItem('cn-reminder-banner-dismissed', 'true'); } catch {}
  };
  const enableReminders = async () => {
    const granted = await requestReminderPermission();
    if (granted) dismissBanner();
  };

  // Find in-progress chapters (notesRead but quiz not complete)
  const inProgressList = Object.entries(progressMap)
    .filter(([, p]) => (p.notesRead || p.flashcardsCompleted) && !p.quizCompleted && p.subjectSlug && p.chapterName)
    .slice(0, 1);

  const continueChapter = inProgressList[0];

  // Weakest attempted chapters (quiz score < 70%) — nudge to revisit
  const weakChapters = Object.entries(progressMap)
    .filter(([, p]) => p.quizCompleted && p.quizPct !== undefined && p.quizPct < 70 && p.subjectSlug && p.chapterName)
    .sort((a, b) => (a[1].quizPct ?? 0) - (b[1].quizPct ?? 0))
    .slice(0, 2);

  // Stats
  const doneCount = Object.values(progressMap).filter(p => p.notesRead && p.flashcardsCompleted && p.quizCompleted).length;
  const quizScores = Object.values(progressMap).filter(p => p.quizCompleted && p.quizPct !== undefined);
  const avgScore = quizScores.length ? Math.round(quizScores.reduce((s, p) => s + (p.quizPct ?? 0), 0) / quizScores.length) : null;

  // My rank
  const myRank = leaderboard.findIndex(e => e.uid === user?.uid) + 1;

  const liveSubjects = subjects.filter(s => s.isLive);
  const lockedSubjects = subjects.filter(s => !s.isLive);

  return (
    <div className={`cn-body ${isDark ? 'dark-mode' : ''}`}>
      <AppHeader />

      <main className="page-content" style={{ gap: 20, paddingTop: 20 }}>

        {/* ── Hero greeting ── */}
        <section className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h1 className="font-display font-black text-2xl leading-tight" style={{ color: 'var(--text)' }}>
                {user ? `Hey ${user.displayName?.split(' ')[0] ?? 'Scholar'} 👋` : 'CrossNotes 📚'}
              </h1>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                {user ? todayMsg() : 'Maharashtra Board 10th — study like a topper.'}
              </p>
            </div>

            {/* Streak ring */}
            <div className="shrink-0">
              <div className="streak-ring">
                <span className="text-xl font-black" style={{ color: '#c2410c', lineHeight: 1 }}>{streak}</span>
                <span className="text-xs font-bold" style={{ color: '#c2410c' }}>🔥</span>
              </div>
              <p className="text-center text-xs font-bold mt-1" style={{ color: 'var(--text-muted)' }}>streak</p>
              {user && streakFreezes > 0 && (
                <p className="text-center text-xs font-bold mt-0.5 flex items-center justify-center gap-0.5" style={{ color: '#0284c7' }} title={`${streakFreezes} of ${MAX_STREAK_FREEZES} streak freezes — a freeze auto-covers one missed day`}>
                  <Snowflake size={11} /> ×{streakFreezes}
                </p>
              )}
            </div>
          </div>

          {/* XP bar */}
          {user && (
            <div className="clay-card p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="level-chip">Lv {level}</span>
                  <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>{levelName}</span>
                </div>
                <span className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>{xp} / {nextXp} XP</span>
              </div>
              <div className="clay-progress h-3">
                <div className="clay-progress-fill xp-bar" style={{ width: `${xpPct}%` }} />
              </div>
              {studiedToday && (
                <p className="text-xs font-bold text-green-600 flex items-center gap-1">
                  <span>✅</span> You studied today!
                </p>
              )}
              <Link href="/shop">
                <div className="flex items-center justify-between mt-1 pt-2" style={{ borderTop: '1px solid var(--divider)' }}>
                  <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--gold)' }}>
                    <Coins size={14} /> {coins} coins
                  </span>
                  <span className="text-xs font-bold" style={{ color: 'var(--primary)' }}>Visit Shop →</span>
                </div>
              </Link>
            </div>
          )}

          {/* Sign in CTA */}
          {!user && (
            <button onClick={signInWithGoogle} className="clay-btn w-full flex items-center justify-center gap-2 py-3">
              <LogIn size={18} /> Sign in with Google to earn XP
            </button>
          )}
        </section>

        {/* ── Reminder opt-in banner ── */}
        {showReminderBanner && (
          <div className="clay-card p-4 flex items-center gap-3" style={{ background: 'var(--blue-light, #dbeafe)', borderColor: '#93c5fd' }}>
            <BellRing size={20} style={{ color: '#1d4ed8' }} className="shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>Never lose your streak</p>
              <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--text-muted)' }}>Get an evening nudge if you haven't studied yet.</p>
            </div>
            <button onClick={enableReminders} className="clay-btn-ghost text-xs py-2 px-3 shrink-0">Enable</button>
            <button onClick={dismissBanner} aria-label="Dismiss" className="shrink-0" style={{ color: 'var(--text-muted)' }}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* ── Active potion boost ── */}
        {boostActive && activeBoostPotion && (
          <div className="clay-card p-4 flex items-center gap-3" style={{ background: 'var(--primary-light)', borderColor: 'var(--primary-border)' }}>
            <PotionIcon potion={activeBoostPotion} size={30} />
            <div className="flex-1">
              <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{activeBoostPotion.name} is active</p>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{activeBoostPotion.multiplier}x XP right now — go farm some chapters.</p>
            </div>
            <Zap size={20} style={{ color: 'var(--gold)' }} />
          </div>
        )}

        {/* ── Stats strip ── */}
        {user && (
          <div className="stats-strip">
            <div className="stat-card">
              <div className="font-display font-black text-2xl" style={{ color: 'var(--primary)' }}>{doneCount}</div>
              <div className="text-xs font-bold mt-0.5" style={{ color: 'var(--text-muted)' }}>Done</div>
            </div>
            <div className="stat-card">
              <div className="font-display font-black text-2xl" style={{ color: '#d97706' }}>{xp}</div>
              <div className="text-xs font-bold mt-0.5" style={{ color: 'var(--text-muted)' }}>Total XP</div>
            </div>
            <div className="stat-card">
              <div className="font-display font-black text-2xl" style={{ color: avgScore !== null && avgScore >= 70 ? '#16a34a' : avgScore !== null ? '#dc2626' : 'var(--text-muted)' }}>
                {avgScore !== null ? `${avgScore}%` : '—'}
              </div>
              <div className="text-xs font-bold mt-0.5" style={{ color: 'var(--text-muted)' }}>Quiz Avg</div>
            </div>
          </div>
        )}

        {/* ── Continue learning ── */}
        {user && continueChapter && (() => {
          const [chapId, p] = continueChapter;
          const nextStep = !p.notesRead ? 'notes' : !p.flashcardsCompleted ? 'flashcards' : 'quiz';
          const stepLabel = nextStep === 'notes' ? '📖 Read Notes' : nextStep === 'flashcards' ? '🃏 Flashcards' : '🧪 Take Quiz';
          return (
            <section>
              <h2 className="section-header mb-3">Continue Learning</h2>
              <Link href={`/${nextStep}/${p.subjectSlug}/${chapId}`}>
                <button className="continue-card w-full">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold opacity-75 mb-1 uppercase tracking-wider">{p.subjectSlug?.replace(/-/g, ' ')}</div>
                      <div className="font-display font-bold text-lg leading-tight mb-1">{p.chapterName}</div>
                      <div className="text-sm opacity-90 font-semibold">{stepLabel}</div>
                    </div>
                    <ChevronRight size={24} className="opacity-80 shrink-0 ml-2" />
                  </div>
                  <div className="mt-3 rounded-full overflow-hidden" style={{ height: 4, background: 'rgba(255,255,255,0.25)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ background: '#fff', width: `${(p.notesRead ? 33 : 0) + (p.flashcardsCompleted ? 33 : 0) + (p.quizCompleted ? 34 : 0)}%`, transition: 'width 0.5s' }}
                    />
                  </div>
                </button>
              </Link>
            </section>
          );
        })()}

        {/* ── Needs revision nudge ── */}
        {user && weakChapters.length > 0 && (
          <section>
            <h2 className="section-header mb-3 flex items-center gap-2">
              <Target size={16} style={{ color: 'var(--red)' }} /> Needs Revision
            </h2>
            <div className="flex flex-col gap-2">
              {weakChapters.map(([chapId, p]) => (
                <Link key={chapId} href={`/quiz/${p.subjectSlug}/${chapId}`}>
                  <div className="clay-card p-4 flex items-center justify-between gap-3 cursor-pointer">
                    <div className="min-w-0">
                      <div className="text-xs font-bold opacity-60 uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>
                        {p.subjectSlug?.replace(/-/g, ' ')}
                      </div>
                      <div className="font-display font-bold text-sm leading-tight truncate" style={{ color: 'var(--text)' }}>{p.chapterName}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-black px-2 py-1 rounded-full" style={{ background: '#fee2e2', color: '#dc2626' }}>{p.quizPct}%</span>
                      <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Daily XP guide ── */}
        <section className="clay-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={18} style={{ color: 'var(--gold)' }} />
            <h2 className="font-display font-bold text-base" style={{ color: 'var(--text)' }}>Earn XP Today</h2>
          </div>
          <div className="flex flex-col gap-2">
            {[
              { icon: '📖', label: 'Read Notes', xp: '+10 XP' },
              { icon: '🃏', label: 'Complete Flashcards', xp: '+20 XP' },
              { icon: '🧪', label: 'Ace a Quiz (≥90%)', xp: '+50 XP' },
            ].map(({ icon, label, xp }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'var(--divider)' }}>
                <span className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  {icon} {label}
                </span>
                <span className="xp-chip">{xp}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Subjects ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-header">Your Subjects</h2>
            <Link href="/subjects">
              <span className="text-sm font-bold" style={{ color: 'var(--primary)' }}>See all →</span>
            </Link>
          </div>

          <div className="subject-grid">
            {liveSubjects.map(s => (
              <Link key={s.id} href={`/subject/${s.slug}`}>
                <div
                  className="subject-quick-card"
                  style={{ background: `var(--${s.color}-bg)`, borderColor: `var(--${s.color}-border)` }}
                >
                  <span className="text-3xl">{s.emoji}</span>
                  <span className="font-display font-bold text-sm leading-tight" style={{ color: 'var(--text)' }}>{s.name}</span>
                  <ChevronRight size={14} style={{ color: `var(--${s.color}-shadow)`, marginTop: 2 }} />
                </div>
              </Link>
            ))}
            {lockedSubjects.slice(0, 4 - liveSubjects.length).map(s => (
              <div
                key={s.id}
                className="subject-quick-card opacity-40"
                style={{ background: `var(--${s.color}-bg)`, borderColor: `var(--${s.color}-border)`, cursor: 'default' }}
              >
                <span className="text-3xl">{s.emoji}</span>
                <span className="font-display font-bold text-sm leading-tight" style={{ color: 'var(--text)' }}>{s.name}</span>
                <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>🔒 Soon</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Leaderboard preview ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy size={18} style={{ color: 'var(--gold)' }} />
              <h2 className="section-header">Top Studiers</h2>
            </div>
            {myRank > 0 && (
              <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid var(--primary-border)' }}>
                You: #{myRank}
              </span>
            )}
          </div>

          <div className="clay-card p-3 flex flex-col gap-1">
            {leaderboard.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-2xl mb-1">🏜️</p>
                <p className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>Be the first to earn XP and claim #1!</p>
              </div>
            ) : (
              leaderboard.slice(0, 5).map((e, i) => (
                <div
                  key={e.uid}
                  className={`leaderboard-row${e.uid === user?.uid ? ' me' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-display font-black text-sm w-6 text-center ${i === 0 ? 'rank-gold' : i === 1 ? 'rank-silver' : i === 2 ? 'rank-bronze' : ''}`} style={i > 2 ? { color: 'var(--text-muted)' } : {}}>
                      #{i + 1}
                    </span>
                    {e.photoURL ? (
                      <img src={e.photoURL} className="w-8 h-8 rounded-full border" style={{ borderColor: 'var(--divider)' }} alt="" />
                    ) : (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: 'var(--bg-card-2)', color: 'var(--text)' }}>
                        {e.displayName?.charAt(0) ?? '?'}
                      </div>
                    )}
                    <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                      {e.uid === user?.uid ? `${e.displayName?.split(' ')[0]} (You)` : e.displayName}
                      {i === 0 && ' 👑'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="streak-chip">{e.streak}🔥</span>
                    <span className="font-display font-bold text-sm" style={{ color: 'var(--primary)' }}>{e.xp} XP</span>
                  </div>
                </div>
              ))
            )}
            <Link href="/leaderboard">
              <button className="clay-btn-ghost w-full mt-2 py-2.5 text-sm">Full Leaderboard →</button>
            </Link>
          </div>
        </section>

      </main>

      <BottomNav />
    </div>
  );
}
