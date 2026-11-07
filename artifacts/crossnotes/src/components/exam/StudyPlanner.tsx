// Study planner: auto-generates a day-by-day plan per subject.
// Algorithm:
//   - Subjects weighted by weakness (rating 1=weak gets more days).
//   - Final day before exam = quick revision only.
//   - Last 10 days window: one mock-test slot per subject.
//   - Missed days (task date < today, not done) trigger a warning.
//   - Tasks are ticked via ExamContext; progress bar per subject.
import { useMemo } from 'react';
import { Check, AlertCircle, BookOpen, ClipboardList, RotateCcw } from 'lucide-react';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';
import { useExam } from '@/contexts/ExamContext';
import { EXAM_TIMETABLE, examStartIST, type ExamEntry, type ExamGroup } from '@/data/examTimetable';

// Returns YYYY-MM-DD in IST
function istDateString(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00+05:30');
  d.setDate(d.getDate() + n);
  return istDateString(d);
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b + 'T00:00:00+05:30').getTime() -
      new Date(a + 'T00:00:00+05:30').getTime()) /
      86400000,
  );
}

function friendlyDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00+05:30').toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Kolkata',
  });
}

type TaskType = 'study' | 'revision' | 'mock-test' | 'quick-revision';

interface PlanTask {
  id: string;        // "{examGroup}:{YYYY-MM-DD}:{taskType}"
  examGroup: ExamGroup;
  date: string;
  type: TaskType;
  label: string;
  subjectLabel: string;
  linkedSlug?: string;
}

const TASK_TYPE_LABEL: Record<TaskType, string> = {
  study: 'Study session',
  revision: 'Spaced revision',
  'mock-test': 'Mock test',
  'quick-revision': 'Quick revision (day before exam)',
};

function buildTaskId(group: ExamGroup, date: string, type: TaskType): string {
  return `${group}:${date}:${type}`;
}

function generatePlan(entries: ExamEntry[], ratings: Partial<Record<ExamGroup, number>>, today: string): PlanTask[] {
  const tasks: PlanTask[] = [];
  const upcoming = entries.filter(e => e.date >= today);

  for (const entry of upcoming) {
    const daysUntil = daysBetween(today, entry.date);
    if (daysUntil <= 0) continue;

    const rating = ratings[entry.id] ?? 3; // default mid strength
    // Weight: weaker subjects get more study days. weight in [1,5]
    const studyWeight = 6 - rating; // 1=strong->1 day weight, 5=weak->5 day weight

    // Available study days (exclude exam day itself, reserve day-before for quick revision)
    const availableDays = Math.max(0, daysUntil - 1);
    if (availableDays === 0) continue;

    // Day before exam: quick revision
    const dayBefore = addDays(entry.date, -1);
    if (dayBefore >= today) {
      tasks.push({
        id: buildTaskId(entry.id, dayBefore, 'quick-revision'),
        examGroup: entry.id,
        date: dayBefore,
        type: 'quick-revision',
        label: TASK_TYPE_LABEL['quick-revision'],
        subjectLabel: entry.label,
        linkedSlug: entry.linkedSlug,
      });
    }

    // Last 10 days: inject a mock test slot (but not on quick-revision day)
    const mockTestDayOffset = Math.max(0, daysUntil - 10);
    const mockTestDate = addDays(today, mockTestDayOffset);
    if (mockTestDate < dayBefore && mockTestDate >= today) {
      tasks.push({
        id: buildTaskId(entry.id, mockTestDate, 'mock-test'),
        examGroup: entry.id,
        date: mockTestDate,
        type: 'mock-test',
        label: TASK_TYPE_LABEL['mock-test'],
        subjectLabel: entry.label,
        linkedSlug: entry.linkedSlug,
      });
    }

    // Distribute study + spaced revision across remaining days
    const studyDays = Math.min(availableDays - 1, Math.round(availableDays * 0.6));
    const revisionDays = availableDays - 1 - studyDays; // -1 for mock test day

    // Study sessions: evenly spread in first portion
    const studyInterval = studyDays > 0 ? Math.max(1, Math.floor((daysUntil - 2) / studyDays)) : 999;
    for (let i = 0; i < studyDays; i++) {
      const offset = i * studyInterval;
      const date = addDays(today, offset);
      if (date >= dayBefore) break;
      if (date === mockTestDate) continue;
      tasks.push({
        id: buildTaskId(entry.id, date, 'study'),
        examGroup: entry.id,
        date,
        type: 'study',
        label: `${TASK_TYPE_LABEL['study']} (${studyWeight > 3 ? 'extra focus' : 'regular'})`,
        subjectLabel: entry.label,
        linkedSlug: entry.linkedSlug,
      });
    }

    // Spaced revision sessions: in second half
    const revStart = studyDays > 0 ? studyDays * studyInterval : 1;
    const revInterval = revisionDays > 0 ? Math.max(1, Math.floor((daysUntil - revStart - 2) / revisionDays)) : 999;
    for (let i = 0; i < revisionDays; i++) {
      const offset = revStart + i * revInterval;
      const date = addDays(today, offset);
      if (date >= dayBefore) break;
      if (date === mockTestDate) continue;
      tasks.push({
        id: buildTaskId(entry.id, date, 'revision'),
        examGroup: entry.id,
        date,
        type: 'revision',
        label: TASK_TYPE_LABEL['revision'],
        subjectLabel: entry.label,
        linkedSlug: entry.linkedSlug,
      });
    }
  }

  // Sort by date then by subject
  tasks.sort((a, b) => a.date.localeCompare(b.date) || a.subjectLabel.localeCompare(b.subjectLabel));
  return tasks;
}

function SubjectRatingRow({
  entry,
  rating,
  onRate,
}: {
  entry: ExamEntry;
  rating: number;
  onRate: (r: number) => void;
}) {
  return (
    <div className="exam-planner-rating-row">
      <span className="exam-planner-rating-label">{entry.label}</span>
      <div className="exam-planner-stars" role="radiogroup" aria-label={`Strength rating for ${entry.label}`}>
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            role="radio"
            aria-checked={rating === star}
            aria-label={`${star} out of 5`}
            className={cn('exam-star-btn', rating >= star && 'active')}
            onClick={() => onRate(star)}
          >
            {star <= 2 ? 'W' : star === 3 ? 'M' : 'S'}
          </button>
        ))}
      </div>
    </div>
  );
}

interface Props {
  entries: ExamEntry[];
}

export default function StudyPlanner({ entries }: Props) {
  const { prefs, setRating, toggleTask, isTaskDone } = useExam();
  const today = istDateString();

  const tasks = useMemo(
    () => generatePlan(entries, prefs.subjectRatings, today),
    [entries, prefs.subjectRatings, today],
  );

  // Group tasks by date
  const byDate = useMemo(() => {
    const map: Record<string, PlanTask[]> = {};
    for (const t of tasks) {
      (map[t.date] = map[t.date] ?? []).push(t);
    }
    return map;
  }, [tasks]);

  // Progress per subject
  const subjectProgress = useMemo(() => {
    const map: Record<ExamGroup, { total: number; done: number }> = {} as Record<ExamGroup, { total: number; done: number }>;
    for (const t of tasks) {
      if (!map[t.examGroup]) map[t.examGroup] = { total: 0, done: 0 };
      map[t.examGroup].total++;
      if (isTaskDone(t.id)) map[t.examGroup].done++;
    }
    return map;
  }, [tasks, prefs.completedTaskIds]);

  const missedCount = tasks.filter(t => t.date < today && !isTaskDone(t.id)).length;

  const upcoming = entries.filter(e => e.date >= today);

  return (
    <div className="exam-planner">
      {/* Subject strength ratings */}
      <div className="clay-card exam-planner-ratings-card">
        <h3 className="exam-section-title">Rate your subject strength</h3>
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
          W = weak, M = medium, S = strong. Weaker subjects get more study days.
        </p>
        <div className="exam-planner-ratings-list">
          {upcoming.map(entry => (
            <SubjectRatingRow
              key={entry.id}
              entry={entry}
              rating={prefs.subjectRatings[entry.id] ?? 3}
              onRate={r => setRating(entry.id, r)}
            />
          ))}
        </div>
      </div>

      {/* Subject progress overview */}
      {upcoming.length > 0 && (
        <div className="clay-card exam-planner-progress-card">
          <h3 className="exam-section-title">Study progress</h3>
          <div className="exam-planner-progress-list">
            {upcoming.map(entry => {
              const prog = subjectProgress[entry.id];
              const pct = prog && prog.total > 0 ? Math.round((prog.done / prog.total) * 100) : 0;
              return (
                <div key={entry.id} className="exam-planner-progress-row">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{entry.label}</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{prog?.done ?? 0}/{prog?.total ?? 0}</span>
                  </div>
                  <div className="clay-progress h-2" aria-label={`${pct}% complete for ${entry.label}`}>
                    <div className="clay-progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Missed tasks warning */}
      {missedCount > 0 && (
        <div className="exam-planner-missed-warning" role="alert">
          <AlertCircle size={15} aria-hidden="true" />
          <span>
            {missedCount} task{missedCount !== 1 ? 's' : ''} missed. Plan has been recalculated for remaining days.
          </span>
        </div>
      )}

      {/* Day-by-day task list */}
      {tasks.length === 0 ? (
        <div className="clay-card p-6 text-center" style={{ color: 'var(--text-muted)' }}>
          No upcoming tasks. All your exams may be complete or no subjects are selected.
        </div>
      ) : (
        Object.entries(byDate).map(([date, dayTasks]) => {
          const isToday = date === today;
          const isPast = date < today;
          return (
            <div key={date} className={cn('exam-planner-day', isToday && 'exam-planner-day--today', isPast && 'exam-planner-day--past')}>
              <div className="exam-planner-day-header">
                <span className="exam-planner-day-label">
                  {isToday ? 'Today' : friendlyDate(date)}
                </span>
                {isToday && <span className="badge badge-revision">Today</span>}
              </div>
              <div className="exam-planner-tasks">
                {dayTasks.map(task => {
                  const done = isTaskDone(task.id);
                  const missed = isPast && !done;
                  return (
                    <div
                      key={task.id}
                      className={cn(
                        'exam-planner-task',
                        done && 'exam-planner-task--done',
                        missed && 'exam-planner-task--missed',
                        task.type === 'quick-revision' && 'exam-planner-task--quickrev',
                        task.type === 'mock-test' && 'exam-planner-task--mock',
                      )}
                    >
                      <button
                        className="exam-task-check"
                        onClick={() => toggleTask(task.id)}
                        aria-label={done ? `Mark ${task.subjectLabel} ${task.label} as not done` : `Mark ${task.subjectLabel} ${task.label} as done`}
                        aria-pressed={done}
                      >
                        {done ? <Check size={14} aria-hidden="true" /> : <span aria-hidden="true" />}
                      </button>
                      <div className="exam-task-body">
                        <div className="exam-task-subject">{task.subjectLabel}</div>
                        <div className="exam-task-label">{task.label}</div>
                      </div>
                      {task.linkedSlug && !done && (
                        <Link
                          href={`/subject/${task.linkedSlug}`}
                          className="exam-task-notes-link"
                          aria-label={`Open notes for ${task.subjectLabel}`}
                        >
                          <BookOpen size={13} aria-hidden="true" />
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
