const ACTIVITY_KEY = 'cn.activity';

interface ActivityState {
  visits: number;
  firstSeen: string;
  lastSeen: string;
  minutes: number;
  hourBuckets: number[];
}

const initialState = (): ActivityState => ({
  visits: 0,
  firstSeen: new Date().toISOString(),
  lastSeen: new Date().toISOString(),
  minutes: 0,
  hourBuckets: Array.from({ length: 24 }, () => 0),
});

export function readActivity(): ActivityState {
  try {
    return { ...initialState(), ...JSON.parse(localStorage.getItem(ACTIVITY_KEY) ?? '{}') };
  } catch {
    return initialState();
  }
}

export function recordVisit(): ActivityState {
  const current = readActivity();
  const hourBuckets = [...(current.hourBuckets ?? Array.from({ length: 24 }, () => 0))];
  hourBuckets[new Date().getHours()] += 1;
  const next = { ...current, visits: current.visits + 1, lastSeen: new Date().toISOString(), hourBuckets };
  try { localStorage.setItem(ACTIVITY_KEY, JSON.stringify(next)); } catch { /* best effort */ }
  return next;
}

export function recordStudyMinutes(minutes: number) {
  const current = readActivity();
  const next = { ...current, minutes: current.minutes + Math.max(0, Math.round(minutes)) };
  try { localStorage.setItem(ACTIVITY_KEY, JSON.stringify(next)); } catch { /* best effort */ }
}

export function getTypicalStudyWindow(activity = readActivity()): string | null {
  const buckets = activity.hourBuckets ?? [];
  const peak = buckets.reduce((best, count, hour) => count > (buckets[best] ?? 0) ? hour : best, -1);
  if (peak < 0 || buckets[peak] === 0) return null;
  const end = (peak + 2) % 24;
  const format = (hour: number) => `${hour % 12 || 12}${hour < 12 ? 'am' : 'pm'}`;
  return `${format(peak)}–${format(end)}`;
}
