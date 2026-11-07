// Full exam timeline: shows all filtered papers with done/today/upcoming states.
// Gap days between papers are highlighted.
import { Link } from 'wouter';
import { CheckCircle2, Circle, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type ExamEntry, examStartIST } from '@/data/examTimetable';

function istDateString(): string {
  // Returns YYYY-MM-DD in IST using Intl.
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return parts; // en-CA gives YYYY-MM-DD
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  return Math.round((db - da) / 86400000);
}

function friendlyDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00+05:30');
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Kolkata',
  });
}

type PaperState = 'done' | 'today' | 'upcoming';

function getPaperState(entry: ExamEntry, today: string): PaperState {
  if (entry.date < today) return 'done';
  if (entry.date === today) return 'today';
  return 'upcoming';
}

interface Props {
  entries: ExamEntry[];
}

export default function ExamTimeline({ entries }: Props) {
  const today = istDateString();

  return (
    <div className="exam-timeline" aria-label="Exam timetable">
      {entries.map((entry, i) => {
        const state = getPaperState(entry, today);
        const prevDate = i > 0 ? entries[i - 1].date : null;
        const gap = prevDate ? daysBetween(prevDate, entry.date) - 1 : 0;

        return (
          <div key={entry.id}>
            {gap > 0 && (
              <div className="exam-timeline-gap" aria-label={`${gap} gap day${gap !== 1 ? 's' : ''}`}>
                <div className="exam-timeline-gap-line" aria-hidden="true" />
                <span className="exam-timeline-gap-label">
                  {gap} day{gap !== 1 ? 's' : ''} gap
                </span>
                <div className="exam-timeline-gap-line" aria-hidden="true" />
              </div>
            )}

            <div
              className={cn(
                'exam-timeline-row',
                `exam-timeline-row--${state}`,
              )}
              aria-label={`${entry.label}${entry.subLabel ? ': ' + entry.subLabel : ''}, ${entry.date}, ${state}`}
            >
              <div className="exam-timeline-icon" aria-hidden="true">
                {state === 'done' ? (
                  <CheckCircle2 size={20} />
                ) : (
                  <Circle size={20} />
                )}
              </div>

              <div className="exam-timeline-body">
                <div className="exam-timeline-date">{friendlyDate(entry.date)}</div>
                <div className="exam-timeline-subject">{entry.label}</div>
                {entry.subLabel && (
                  <div className="exam-timeline-sublabel">{entry.subLabel}</div>
                )}
                <div className="exam-timeline-time">
                  {entry.startTime}&ndash;{entry.endTime} IST
                </div>
              </div>

              <div className="exam-timeline-right">
                {state === 'done' && (
                  <span className="badge badge-done">Done</span>
                )}
                {state === 'today' && (
                  <span className="badge badge-revision">Today</span>
                )}
                {entry.linkedSlug && state !== 'done' && (
                  <Link
                    href={`/subject/${entry.linkedSlug}`}
                    className="exam-timeline-notes-link"
                    aria-label={`Open notes for ${entry.label}`}
                  >
                    <BookOpen size={14} aria-hidden="true" />
                    Notes
                  </Link>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
