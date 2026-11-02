/**
 * Pure streak math — no Firestore, no React.
 *
 * Gap rules (calendar days in the user's IANA timezone):
 *   0 → no change (idempotent same-day)
 *   1 → increment
 *   2 + freeze → consume one freeze, keep streak, then increment
 *   else → reset to 1, open a 24h coin-paid repair window
 *
 * Freezes cap at 2. Never lower an existing streak during backfill.
 */

export const MAX_STREAK_FREEZES = 2;
export const STREAK_MILESTONES = [3, 7, 30, 100] as const;
export const REPAIR_WINDOW_MS = 24 * 60 * 60 * 1000;
export const REPAIR_COIN_COST = 50;
/** Alternate qualifier: earn this much XP in one local day. */
export const DAILY_XP_QUALIFY = 20;

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null; // YYYY-MM-DD in user timezone
  timezone: string;
  freezes: number;
  repairAvailableUntil: string | null; // ISO
  pendingRepairStreak: number | null;
}

export type StreakEvent =
  | 'unchanged'
  | 'started'
  | 'incremented'
  | 'freeze_used'
  | 'lost'
  | 'repaired'
  | 'comeback'
  | 'milestone';

export interface StreakApplyResult {
  state: StreakState;
  gap: number | null;
  events: StreakEvent[];
  milestone: number | null;
  freezeUsed: boolean;
  /** True when streak fields did not change (same local day). */
  unchanged: boolean;
}

export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/** Local calendar date YYYY-MM-DD for an instant in an IANA timezone. */
export function localDateKey(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}

/** Whole calendar-day gap between two YYYY-MM-DD keys (UTC noon anchors). */
export function calendarDayGap(fromKey: string, toKey: string): number {
  const parse = (key: string) => {
    const [y, m, d] = key.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((parse(toKey) - parse(fromKey)) / 86_400_000);
}

export function emptyStreakState(timezone = detectTimezone()): StreakState {
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: null,
    timezone,
    freezes: 0,
    repairAvailableUntil: null,
    pendingRepairStreak: null,
  };
}

/**
 * Lazy, idempotent backfill — fills missing fields without lowering streak.
 */
export function backfillStreakState(
  raw: Partial<StreakState> & { streak?: number; streakFreezes?: number },
  todayKey: string,
): StreakState {
  const current = Math.max(0, raw.currentStreak ?? raw.streak ?? 0);
  const longest = Math.max(current, raw.longestStreak ?? 0);
  const freezes = Math.min(
    MAX_STREAK_FREEZES,
    Math.max(0, raw.freezes ?? raw.streakFreezes ?? 0),
  );
  const timezone = raw.timezone || detectTimezone();

  let lastActiveDate = raw.lastActiveDate ?? null;
  // If they have a streak but no date, assume yesterday so today's activity increments.
  if (!lastActiveDate && current > 0) {
    const [y, m, d] = todayKey.split('-').map(Number);
    const yesterday = new Date(Date.UTC(y, m - 1, d - 1));
    lastActiveDate = yesterday.toISOString().slice(0, 10);
  }

  return {
    currentStreak: current,
    longestStreak: longest,
    lastActiveDate,
    timezone,
    freezes,
    repairAvailableUntil: raw.repairAvailableUntil ?? null,
    pendingRepairStreak: raw.pendingRepairStreak ?? null,
  };
}

function withLongest(state: StreakState): StreakState {
  return {
    ...state,
    longestStreak: Math.max(state.longestStreak, state.currentStreak),
  };
}

function milestoneHit(prev: number, next: number): number | null {
  for (const m of STREAK_MILESTONES) {
    if (prev < m && next >= m) return m;
  }
  return null;
}

/**
 * Apply one qualifying study action for `todayKey` (already in user TZ).
 * Idempotent for the same local day.
 */
export function applyQualifyingActivity(
  raw: Partial<StreakState> & { streak?: number; streakFreezes?: number },
  todayKey: string,
  nowMs: number,
): StreakApplyResult {
  const prev = backfillStreakState(raw, todayKey);
  const events: StreakEvent[] = [];

  if (!prev.lastActiveDate) {
    const currentStreak = Math.max(1, prev.currentStreak);
    const state = withLongest({
      ...prev,
      currentStreak,
      lastActiveDate: todayKey,
      repairAvailableUntil: null,
      pendingRepairStreak: null,
    });
    const milestone = milestoneHit(prev.currentStreak, currentStreak);
    if (milestone) events.push('milestone');
    events.push('started');
    return {
      state,
      gap: null,
      events,
      milestone,
      freezeUsed: false,
      unchanged: false,
    };
  }

  const gap = calendarDayGap(prev.lastActiveDate, todayKey);

  if (gap === 0) {
    return {
      state: prev,
      gap: 0,
      events: ['unchanged'],
      milestone: null,
      freezeUsed: false,
      unchanged: true,
    };
  }

  if (gap === 1) {
    const currentStreak = prev.currentStreak + 1;
    const milestone = milestoneHit(prev.currentStreak, currentStreak);
    const state = withLongest({
      ...prev,
      currentStreak,
      lastActiveDate: todayKey,
      repairAvailableUntil: null,
      pendingRepairStreak: null,
    });
    events.push('incremented');
    if (milestone) events.push('milestone');
    return { state, gap, events, milestone, freezeUsed: false, unchanged: false };
  }

  if (gap === 2 && prev.freezes > 0) {
    const freezes = prev.freezes - 1;
    const currentStreak = prev.currentStreak + 1;
    const milestone = milestoneHit(prev.currentStreak, currentStreak);
    const state = withLongest({
      ...prev,
      currentStreak,
      freezes,
      lastActiveDate: todayKey,
      repairAvailableUntil: null,
      pendingRepairStreak: null,
    });
    events.push('freeze_used', 'incremented');
    if (milestone) events.push('milestone');
    return { state, gap, events, milestone, freezeUsed: true, unchanged: false };
  }

  // Lost — reset to 1, open repair window. Preserve longest.
  const pendingRepairStreak = prev.currentStreak > 0 ? prev.currentStreak : null;
  const state = withLongest({
    ...prev,
    currentStreak: 1,
    lastActiveDate: todayKey,
    repairAvailableUntil: new Date(nowMs + REPAIR_WINDOW_MS).toISOString(),
    pendingRepairStreak,
  });
  events.push('lost', 'started');
  if (gap >= 7) events.push('comeback');
  return {
    state,
    gap,
    events,
    milestone: null,
    freezeUsed: false,
    unchanged: false,
  };
}

/** Coin-paid repair restores pendingRepairStreak if still inside the window. */
export function applyStreakRepair(state: StreakState, nowMs: number): StreakApplyResult | null {
  if (!state.repairAvailableUntil || nowMs > Date.parse(state.repairAvailableUntil)) {
    return null;
  }
  const restore = state.pendingRepairStreak ?? 0;
  if (restore < 1) return null;

  const currentStreak = Math.max(state.currentStreak, restore);
  const next = withLongest({
    ...state,
    currentStreak,
    repairAvailableUntil: null,
    pendingRepairStreak: null,
  });
  const milestone = milestoneHit(state.currentStreak, currentStreak);
  const events: StreakEvent[] = ['repaired'];
  if (milestone) events.push('milestone');
  return {
    state: next,
    gap: null,
    events,
    milestone,
    freezeUsed: false,
    unchanged: false,
  };
}

export function isRepairAvailable(state: StreakState, nowMs: number): boolean {
  return !!(
    state.repairAvailableUntil &&
    state.pendingRepairStreak &&
    state.pendingRepairStreak > 0 &&
    nowMs <= Date.parse(state.repairAvailableUntil)
  );
}

/** True when today is not yet active and local hour >= warnHour. */
export function isStreakAtRisk(
  state: StreakState,
  todayKey: string,
  localHour: number,
  warnHour = 19,
): boolean {
  if (state.currentStreak <= 0) return false;
  if (state.lastActiveDate === todayKey) return false;
  return localHour >= warnHour;
}
