// Live countdown to the next exam (and to the first exam if still upcoming).
// Ticks every second; uses fixed-width tabular-nums to prevent layout shift.
// Timezone: Asia/Kolkata (IST = UTC+5:30).
import { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';
import { type ExamEntry, examStartIST } from '@/data/examTimetable';

function nowIST(): Date {
  // Returns a Date whose getTime() value equals the current wall-clock instant,
  // but we use it only for arithmetic — no display formatting needed.
  return new Date();
}

function formatDuration(ms: number): { days: number; hours: number; minutes: number; seconds: number } {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

interface Props {
  entries: ExamEntry[];
}

export default function ExamCountdown({ entries }: Props) {
  const [now, setNow] = useState(() => nowIST());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => setNow(nowIST()), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const upcoming = entries.filter(e => examStartIST(e) > now);
  const next = upcoming[0] ?? null;
  const first = entries[0] ?? null;

  if (!next && !first) {
    return (
      <div className="clay-card exam-countdown-card" aria-live="polite">
        <p style={{ color: 'var(--text-muted)' }}>All exams have been completed. Best of luck with your results!</p>
      </div>
    );
  }

  const target = next ?? first;
  const targetDate = examStartIST(target);
  const diff = targetDate.getTime() - now.getTime();
  const { days, hours, minutes, seconds } = formatDuration(diff);

  const isFirst = target === first && upcoming.length === entries.length;

  return (
    <div className="exam-countdown-card clay-card" aria-live="polite" aria-atomic="true">
      <div className="exam-countdown-label">
        <Clock size={15} aria-hidden="true" />
        <span>
          {diff <= 0
            ? 'Exam in progress'
            : isFirst
            ? 'Time until first exam'
            : 'Time until next exam'}
        </span>
      </div>

      <div className="exam-countdown-subject">{target.label}</div>
      {target.subLabel && (
        <div className="exam-countdown-sublabel">{target.subLabel}</div>
      )}

      {diff > 0 ? (
        <div className="exam-countdown-digits" aria-label={`${days} days ${hours} hours ${minutes} minutes ${seconds} seconds`}>
          <div className="exam-countdown-unit">
            <span className="exam-countdown-num">{days}</span>
            <span className="exam-countdown-unit-label">days</span>
          </div>
          <span className="exam-countdown-sep" aria-hidden="true">:</span>
          <div className="exam-countdown-unit">
            <span className="exam-countdown-num">{pad(hours)}</span>
            <span className="exam-countdown-unit-label">hrs</span>
          </div>
          <span className="exam-countdown-sep" aria-hidden="true">:</span>
          <div className="exam-countdown-unit">
            <span className="exam-countdown-num">{pad(minutes)}</span>
            <span className="exam-countdown-unit-label">min</span>
          </div>
          <span className="exam-countdown-sep" aria-hidden="true">:</span>
          <div className="exam-countdown-unit">
            <span className="exam-countdown-num">{pad(seconds)}</span>
            <span className="exam-countdown-unit-label">sec</span>
          </div>
        </div>
      ) : (
        <div className="exam-countdown-inprogress">Exam is currently in progress</div>
      )}

      <div className="exam-countdown-date">
        {target.date} &middot; {target.startTime}&ndash;{target.endTime} IST
      </div>
    </div>
  );
}
