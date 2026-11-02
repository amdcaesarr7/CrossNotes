import { describe, expect, it } from 'vitest';
import {
  applyQualifyingActivity,
  applyStreakRepair,
  backfillStreakState,
  calendarDayGap,
  emptyStreakState,
  localDateKey,
  MAX_STREAK_FREEZES,
  type StreakState,
} from './streak';

const TZ = 'Asia/Kolkata';
const NOON = (isoDate: string) => Date.parse(`${isoDate}T12:00:00+05:30`);

function base(partial: Partial<StreakState> = {}): StreakState {
  return {
    ...emptyStreakState(TZ),
    currentStreak: 5,
    longestStreak: 10,
    lastActiveDate: '2026-03-10',
    freezes: 1,
    ...partial,
  };
}

describe('localDateKey / calendarDayGap', () => {
  it('formats YYYY-MM-DD in the given timezone', () => {
    // 2026-03-10 23:30 UTC = 2026-03-11 05:00 in Kolkata
    const d = new Date('2026-03-10T23:30:00Z');
    expect(localDateKey(d, 'Asia/Kolkata')).toBe('2026-03-11');
    expect(localDateKey(d, 'America/Los_Angeles')).toBe('2026-03-10');
  });

  it('handles month and year edges', () => {
    expect(calendarDayGap('2026-01-31', '2026-02-01')).toBe(1);
    expect(calendarDayGap('2026-12-31', '2027-01-01')).toBe(1);
    expect(calendarDayGap('2026-02-28', '2026-03-01')).toBe(1);
  });

  it('returns 0 for the same day and negative when reversed', () => {
    expect(calendarDayGap('2026-03-10', '2026-03-10')).toBe(0);
    expect(calendarDayGap('2026-03-12', '2026-03-10')).toBe(-2);
  });
});

describe('applyQualifyingActivity gaps', () => {
  it('1) first day (no previous) → streak 1, longest ≥ 1', () => {
    const res = applyQualifyingActivity(emptyStreakState(TZ), '2026-03-10', NOON('2026-03-10'));
    expect(res.state.currentStreak).toBe(1);
    expect(res.state.longestStreak).toBe(1);
    expect(res.state.lastActiveDate).toBe('2026-03-10');
    expect(res.events).toContain('started');
  });

  it('2) same day → unchanged', () => {
    const res = applyQualifyingActivity(base(), '2026-03-10', NOON('2026-03-10'));
    expect(res.unchanged).toBe(true);
    expect(res.state.currentStreak).toBe(5);
    expect(res.gap).toBe(0);
  });

  it('3) next day → increment', () => {
    const res = applyQualifyingActivity(base(), '2026-03-11', NOON('2026-03-11'));
    expect(res.state.currentStreak).toBe(6);
    expect(res.events).toContain('incremented');
    expect(res.gap).toBe(1);
  });

  it('4) 2-day gap with freeze → consume freeze, keep + increment', () => {
    const res = applyQualifyingActivity(base({ freezes: 1 }), '2026-03-12', NOON('2026-03-12'));
    expect(res.freezeUsed).toBe(true);
    expect(res.state.freezes).toBe(0);
    expect(res.state.currentStreak).toBe(6);
    expect(res.events).toContain('freeze_used');
  });

  it('5) 2-day gap without freeze → reset to 1 + repair window', () => {
    const res = applyQualifyingActivity(base({ freezes: 0 }), '2026-03-12', NOON('2026-03-12'));
    expect(res.state.currentStreak).toBe(1);
    expect(res.state.pendingRepairStreak).toBe(5);
    expect(res.state.repairAvailableUntil).toBeTruthy();
    expect(res.events).toContain('lost');
  });

  it('6) 5-day gap → reset to 1, longest kept', () => {
    const res = applyQualifyingActivity(base({ freezes: 2 }), '2026-03-15', NOON('2026-03-15'));
    expect(res.state.currentStreak).toBe(1);
    expect(res.state.longestStreak).toBe(10);
    expect(res.state.freezes).toBe(2); // freezes only cover exact gap===2
    expect(res.events).toContain('lost');
  });

  it('7) month boundary treated as next day', () => {
    const res = applyQualifyingActivity(
      base({ lastActiveDate: '2026-01-31', currentStreak: 4 }),
      '2026-02-01',
      NOON('2026-02-01'),
    );
    expect(res.gap).toBe(1);
    expect(res.state.currentStreak).toBe(5);
  });

  it('8) year boundary treated as next day', () => {
    const res = applyQualifyingActivity(
      base({ lastActiveDate: '2026-12-31', currentStreak: 4 }),
      '2027-01-01',
      NOON('2027-01-01'),
    );
    expect(res.gap).toBe(1);
    expect(res.state.currentStreak).toBe(5);
  });

  it('hits milestone 7 and caps freezes at 2', () => {
    const res = applyQualifyingActivity(
      base({ currentStreak: 6, longestStreak: 6, freezes: MAX_STREAK_FREEZES, lastActiveDate: '2026-03-10' }),
      '2026-03-11',
      NOON('2026-03-11'),
    );
    expect(res.milestone).toBe(7);
    expect(res.state.freezes).toBeLessThanOrEqual(MAX_STREAK_FREEZES);
  });

  it('comeback fires on long gap (≥7)', () => {
    const res = applyQualifyingActivity(base(), '2026-03-20', NOON('2026-03-20'));
    expect(res.events).toContain('comeback');
    expect(res.events).toContain('lost');
  });
});

describe('repair path', () => {
  it('restores pending streak inside the window', () => {
    const lost = applyQualifyingActivity(base({ freezes: 0 }), '2026-03-12', NOON('2026-03-12'));
    const repaired = applyStreakRepair(lost.state, NOON('2026-03-12') + 3_600_000);
    expect(repaired).not.toBeNull();
    expect(repaired!.state.currentStreak).toBe(5);
    expect(repaired!.events).toContain('repaired');
    expect(repaired!.state.repairAvailableUntil).toBeNull();
  });

  it('rejects repair after the 24h window', () => {
    const lost = applyQualifyingActivity(base({ freezes: 0 }), '2026-03-12', NOON('2026-03-12'));
    const tooLate = Date.parse(lost.state.repairAvailableUntil!) + 1;
    expect(applyStreakRepair(lost.state, tooLate)).toBeNull();
  });
});

describe('backfill never reduces streak', () => {
  it('keeps legacy streak and does not lower it', () => {
    const filled = backfillStreakState(
      { streak: 12, streakFreezes: 5, longestStreak: 3 },
      '2026-03-10',
    );
    expect(filled.currentStreak).toBe(12);
    expect(filled.longestStreak).toBe(12);
    expect(filled.freezes).toBe(MAX_STREAK_FREEZES);
    expect(filled.lastActiveDate).toBeTruthy();
  });
});
