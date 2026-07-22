import { Wifi, BookOpen, Target, Star, Flame, Tag } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLeaderboard, getLevel } from '@/hooks/useFirestore';
import AppHeader from '@/components/AppHeader';
import BottomNav from '@/components/BottomNav';
import '../crossnotes.css';

function PodiumCard({ entry, rank }: {
  entry: { uid: string; displayName: string | null; photoURL: string | null; xp: number; streak: number; nickname?: string | null };
  rank: 1 | 2 | 3;
}) {
  const { levelName } = getLevel(entry.xp);
  const styles: Record<1|2|3, { border: string; bg: string; accent: string; h: string }> = {
    1: { border: '#fbbf24', bg: 'var(--gold-light)', accent: '#92400e', h: '130px' },
    2: { border: '#9ca3af', bg: 'var(--bg-card-2)', accent: 'var(--text-muted)', h: '100px' },
    3: { border: '#fb923c', bg: '#fff7ed', accent: '#9a3412', h: '90px' },
  };
  const s = styles[rank];
  return (
    <div className="flex-1 flex flex-col items-center gap-2">
      {/* Avatar */}
      <div className="relative">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl overflow-hidden"
          style={{ background: 'var(--bg-card)', border: `3px solid ${s.border}`, boxShadow: `0 0 0 4px ${s.border}33` }}
        >
          {entry.photoURL ? (
            <img src={entry.photoURL} className="w-full h-full object-cover" alt="" />
          ) : (
            <span style={{ color: 'var(--text)' }}>{entry.displayName?.charAt(0) ?? '?'}</span>
          )}
        </div>
        <div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-xs font-black px-2 py-0.5 rounded-full"
          style={{ background: s.border, color: rank === 2 ? '#1a1a1a' : '#fff', whiteSpace: 'nowrap' }}
        >
          #{rank}{rank === 1 && ' 👑'}
        </div>
      </div>
      {/* Podium block — min-height, not a fixed height: a fixed height clipped
          the nickname line (and long names) for anyone whose content didn't
          fit exactly the 4 lines this was originally tuned for. min-height
          keeps the 1st/2nd/3rd size hierarchy for everyone else, but lets the
          box grow instead of slicing text off when there's more to show. */}
      <div
        className="w-full rounded-t-xl flex flex-col items-center justify-end pb-4 pt-2 px-2 text-center border-x-2 border-t-2"
        style={{ minHeight: s.h, background: s.bg, borderColor: s.border }}
      >
        <div className="font-bold text-xs leading-tight truncate w-full text-center" style={{ color: 'var(--text)' }}>
          {entry.displayName}
        </div>
        {entry.nickname && (
          <div className="text-xs font-bold truncate w-full text-center flex items-center justify-center gap-0.5 mt-0.5" style={{ color: s.accent }}>
            <Tag size={9} /> {entry.nickname}
          </div>
        )}
        <div className="text-xs font-black uppercase tracking-wider mt-0.5" style={{ color: s.accent }}>{levelName}</div>
        <div className="font-display font-black text-base mt-1" style={{ color: 'var(--text)' }}>{entry.xp} XP</div>
        <div className="text-xs font-bold mt-0.5" style={{ color: '#c2410c' }}>{entry.streak}🔥</div>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { entries, loading } = useLeaderboard();

  const topThree = entries.slice(0, 3) as typeof entries;
  const rest     = entries.slice(3);

  return (
    <div className={`cn-body ${isDark ? 'dark-mode' : ''}`}>
      <AppHeader title="Leaderboard" />

      <main className="page-content" style={{ maxWidth: 640 }}>
        {/* Header */}
        <div className="clay-card p-4 flex items-center justify-between" style={{ background: 'var(--gold-light)', borderColor: 'var(--gold-border)' }}>
          <div>
            <h2 className="font-display font-bold text-base" style={{ color: '#92400e' }}>Holy Crossians Rankings</h2>
            <div className="flex items-center gap-1 mt-1 text-xs font-bold text-green-700">
              <Wifi size={11} /> Live updates
            </div>
          </div>
          <div className="flex flex-col gap-1 text-xs font-bold" style={{ color: '#92400e' }}>
            <span className="flex items-center gap-1"><BookOpen size={11} /> +10 read</span>
            <span className="flex items-center gap-1"><Star size={11} /> +20 cards</span>
            <span className="flex items-center gap-1"><Target size={11} /> +50 quiz</span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: 'var(--bg-card-2)' }} />)}
          </div>
        ) : entries.length === 0 ? (
          <div className="clay-card p-10 flex flex-col items-center text-center gap-3">
            <p className="text-5xl">🏜️</p>
            <h2 className="font-display font-bold text-xl" style={{ color: 'var(--text)' }}>Nobody here yet.</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Be the first to earn XP and claim the #1 spot! Your competition is probably napping.</p>
          </div>
        ) : (
          <>
            {/* Podium */}
            {topThree.length === 3 && (
              <div className="flex items-end gap-3 mt-4">
                {/* 2nd */}
                <PodiumCard entry={topThree[1]} rank={2} />
                {/* 1st */}
                <PodiumCard entry={topThree[0]} rank={1} />
                {/* 3rd */}
                <PodiumCard entry={topThree[2]} rank={3} />
              </div>
            )}

            {/* Full list */}
            <div className="clay-card p-2 flex flex-col gap-0.5">
              {entries.map((entry, i) => {
                const { levelName } = getLevel(entry.xp);
                const isMe = entry.uid === user?.uid;
                return (
                  <div key={entry.uid} className={`leaderboard-row${isMe ? ' me' : ''}`}>
                    <div className="flex items-center gap-3">
                      <span
                        className={`font-display font-black text-sm w-7 text-center shrink-0 ${i === 0 ? 'rank-gold' : i === 1 ? 'rank-silver' : i === 2 ? 'rank-bronze' : ''}`}
                        style={i > 2 ? { color: 'var(--text-muted)', opacity: 0.6 } : {}}
                      >
                        #{i + 1}
                      </span>
                      {entry.photoURL ? (
                        <img src={entry.photoURL} className="w-9 h-9 rounded-full border-2 shrink-0" style={{ borderColor: 'var(--divider)' }} alt="" />
                      ) : (
                        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0" style={{ background: 'var(--bg-card-2)', color: 'var(--text)' }}>
                          {entry.displayName?.charAt(0) ?? '?'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-bold text-sm flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                          <span className="truncate">{entry.uid === user?.uid ? `${entry.displayName} (You)` : entry.displayName}</span>
                          {i === 0 && <span>👑</span>}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {entry.nickname && (
                            <span className="text-xs font-bold flex items-center gap-0.5 truncate" style={{ color: 'var(--gold)' }}>
                              <Tag size={9} /> {entry.nickname}
                            </span>
                          )}
                          <div className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{levelName}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="streak-chip hidden sm:inline-flex">{entry.streak}<Flame size={11} /></span>
                      <span className="font-display font-bold text-sm" style={{ color: 'var(--primary)' }}>{entry.xp}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>XP</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
