/**
 * Local tracker for weekly study activity and study day calendar.
 *
 * Keeps track of unique YYYY-MM-DD dates where the user performed a real study action
 * (read notes, finished flashcards, or completed a quiz).
 *
 * Works offline and online for both guests and authenticated users.
 */

const STORAGE_PREFIX = 'cn-study-dates-';

function getTodayKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getStorageKey(uid?: string | null): string {
  return `${STORAGE_PREFIX}${uid || 'guest'}`;
}

export function recordStudyDate(uid?: string | null): void {
  try {
    const key = getStorageKey(uid);
    const raw = localStorage.getItem(key);
    const dates: string[] = raw ? JSON.parse(raw) : [];
    const today = getTodayKey();
    if (!dates.includes(today)) {
      dates.push(today);
      // Keep at most 60 days of history
      const trimmed = dates.slice(-60);
      localStorage.setItem(key, JSON.stringify(trimmed));
    }
  } catch {
    /* ignore storage errors */
  }
}

export function getStudyDates(uid?: string | null): string[] {
  try {
    const key = getStorageKey(uid);
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export interface DayActivity {
  dayName: string; // 'M', 'T', 'W', 'T', 'F', 'S', 'S'
  dateStr: string; // YYYY-MM-DD
  isToday: boolean;
  studied: boolean;
}

/** Returns the 7 days of the current week (Monday to Sunday) with study status. */
export function getCurrentWeekActivity(uid?: string | null): {
  days: DayActivity[];
  studiedCount: number;
} {
  const dates = new Set(getStudyDates(uid));
  const todayStr = getTodayKey();
  const now = new Date();

  // Find Monday of the current week
  const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon, ...
  const distanceToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + distanceToMon);

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const days: DayActivity[] = [];
  let studiedCount = 0;

  for (let i = 0; i < 7; i++) {
    const cur = new Date(monday);
    cur.setDate(monday.getDate() + i);

    const year = cur.getFullYear();
    const month = String(cur.getMonth() + 1).padStart(2, '0');
    const day = String(cur.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const studied = dates.has(dateStr);
    if (studied) studiedCount++;

    days.push({
      dayName: dayLabels[i],
      dateStr,
      isToday: dateStr === todayStr,
      studied,
    });
  }

  return { days, studiedCount };
}
