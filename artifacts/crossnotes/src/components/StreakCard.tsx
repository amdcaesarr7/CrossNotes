import { useState, useEffect } from 'react';
import { Flame, Snowflake, ShieldCheck, CheckCircle2, HelpCircle, Info } from 'lucide-react';
import { getCurrentWeekActivity, type DayActivity } from '@/lib/studyTracker';
import { VOICE } from '@/lib/voice';
import { MAX_STREAK_FREEZES } from '@/hooks/useFirestore';

interface StreakCardProps {
  streak: number;
  streakFreezes?: number;
  studiedToday: boolean;
  uid?: string | null;
}

export default function StreakCard({ streak, streakFreezes = 0, studiedToday, uid }: StreakCardProps) {
  const [weekData, setWeekData] = useState<{ days: DayActivity[]; studiedCount: number }>({
    days: [],
    studiedCount: 0,
  });
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    setWeekData(getCurrentWeekActivity(uid));
  }, [uid, studiedToday]);

  const targetDays = 5;

  return (
    <section className="clay-card p-4 flex flex-col gap-3.5" aria-label="Streak and weekly habit tracker">
      {/* Top row: Streak + Freezes */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-lg shadow-sm" style={{ background: '#ffedd5', color: '#c2410c' }}>
            <Flame size={22} className="streak-fire" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-black text-xl leading-none" style={{ color: 'var(--text)' }}>
                {streak} {streak === 1 ? 'day streak' : 'days streak'}
              </span>
            </div>
            <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {studiedToday ? VOICE.studiedToday : VOICE.notStudiedNudge}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowInfo(!showInfo)}
          className="text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 transition-colors"
          style={{ background: 'var(--bg-card-2)', color: 'var(--text-muted)' }}
          aria-label="Streak rules info"
        >
          <Info size={14} /> Rules
        </button>
      </div>

      {/* Info panel collapsible */}
      {showInfo && (
        <div className="text-xs p-3 rounded-lg flex flex-col gap-1.5 border" style={{ background: 'var(--bg-card-2)', borderColor: 'var(--divider)' }}>
          <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>How Streaks & Freezes Work 🧠</p>
          <ul className="list-disc pl-4 flex flex-col gap-1 text-muted leading-relaxed">
            <li><strong>Qualifying:</strong> Earn XP by reading Notes, finishing Flashcards, or completing a Quiz. Logging in alone doesn't count.</li>
            <li><strong>Streak Freezes:</strong> Banked automatically every 5-day streak milestone (max {MAX_STREAK_FREEZES}). Covers 1 missed day.</li>
            <li><strong>Consistency over Perfection:</strong> Aim for {targetDays} study days each week even if life happens!</li>
          </ul>
        </div>
      )}

      {/* Weekly Study Days Row */}
      <div className="pt-2" style={{ borderTop: '1px solid var(--divider)' }}>
        <div className="flex items-center justify-between text-xs font-bold mb-2">
          <span style={{ color: 'var(--text)' }}>Weekly goal ({weekData.studiedCount}/{targetDays} days)</span>
          <span style={{ color: weekData.studiedCount >= targetDays ? '#166534' : 'var(--text-muted)' }}>
            {weekData.studiedCount >= targetDays ? 'Goal hit! 🎉' : `${targetDays - weekData.studiedCount} days to go`}
          </span>
        </div>

        {/* 7-Day Pill Row */}
        <div className="grid grid-cols-7 gap-1.5">
          {weekData.days.map((day, idx) => {
            const isDone = day.studied;
            const isToday = day.isToday;

            return (
              <div
                key={`${day.dateStr}-${idx}`}
                className="flex flex-col items-center gap-1 p-1.5 rounded-lg border text-center transition-transform"
                style={{
                  background: isDone
                    ? 'rgba(34, 197, 94, 0.12)'
                    : isToday
                    ? 'var(--bg-card-2)'
                    : 'transparent',
                  borderColor: isDone
                    ? '#86efac'
                    : isToday
                    ? 'var(--primary)'
                    : 'var(--divider)',
                }}
                title={`${day.dateStr}: ${isDone ? 'Studied' : 'No study registered'}`}
              >
                <span className="text-[10px] font-bold uppercase" style={{ color: isToday ? 'var(--primary)' : 'var(--text-muted)' }}>
                  {day.dayName}
                </span>
                <span className="text-xs font-black">
                  {isDone ? '✅' : isToday ? '⏳' : '·'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Streak Freeze Badge Footer */}
      <div className="flex items-center justify-between text-xs font-semibold px-2 py-1.5 rounded-md" style={{ background: 'var(--bg-card-2)' }}>
        <span className="flex items-center gap-1.5" style={{ color: '#0284c7' }}>
          <Snowflake size={14} />
          <strong>{streakFreezes} / {MAX_STREAK_FREEZES} Freezes ready</strong>
        </span>
        <span style={{ color: 'var(--text-muted)' }}>
          {streakFreezes === MAX_STREAK_FREEZES ? 'Max banked' : 'Earn 1 every 5-day streak'}
        </span>
      </div>
    </section>
  );
}
