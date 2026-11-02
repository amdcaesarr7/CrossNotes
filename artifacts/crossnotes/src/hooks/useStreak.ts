/**
 * useStreak — single React hook over lib/streak.ts + Firestore.
 * Backfills legacy profiles on first read; repair is a coin-paid transaction.
 * Qualifying activity writes still go through useFirestore (markNotesRead etc.),
 * which call applyQualifyingActivity inside the same XP transaction.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUserProfile, type UserProfile } from '@/hooks/useFirestore';
import {
  applyStreakRepair,
  backfillStreakState,
  detectTimezone,
  isRepairAvailable,
  isStreakAtRisk,
  localDateKey,
  REPAIR_COIN_COST,
  type StreakState,
} from '@/lib/streak';

export type StreakProfile = UserProfile & {
  longestStreak?: number;
  lastActiveDate?: string | null;
  timezone?: string;
  repairAvailableUntil?: string | null;
  pendingRepairStreak?: number | null;
  xpEarnedToday?: number;
  xpEarnedOnDate?: string;
};

function profileToStreak(p: StreakProfile | null | undefined, todayKey: string): StreakState {
  return backfillStreakState(
    {
      currentStreak: p?.streak ?? 0,
      longestStreak: p?.longestStreak,
      lastActiveDate: p?.lastActiveDate ?? null,
      timezone: p?.timezone,
      freezes: p?.streakFreezes,
      repairAvailableUntil: p?.repairAvailableUntil ?? null,
      pendingRepairStreak: p?.pendingRepairStreak ?? null,
      streak: p?.streak,
      streakFreezes: p?.streakFreezes,
    },
    todayKey,
  );
}

export interface UseStreakReturn {
  streak: StreakState;
  studiedToday: boolean;
  atRisk: boolean;
  canRepair: boolean;
  repairCost: number;
  loading: boolean;
  repairStreak: () => Promise<{ ok: true; streak: number } | { ok: false; reason: string }>;
}

export function useStreak(uid: string | undefined): UseStreakReturn {
  const { profile, loading } = useUserProfile(uid);
  const timezone = (profile as StreakProfile | null)?.timezone || detectTimezone();
  const todayKey = localDateKey(new Date(), timezone);
  const streak = useMemo(
    () => profileToStreak(profile as StreakProfile | null, todayKey),
    [profile, todayKey],
  );

  const [localHour, setLocalHour] = useState(() => {
    try {
      return Number(
        new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric', hour12: false })
          .format(new Date()),
      );
    } catch {
      return new Date().getHours();
    }
  });

  useEffect(() => {
    const id = window.setInterval(() => {
      try {
        setLocalHour(
          Number(
            new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric', hour12: false })
              .format(new Date()),
          ),
        );
      } catch {
        setLocalHour(new Date().getHours());
      }
    }, 60_000);
    return () => window.clearInterval(id);
  }, [timezone]);

  // Lazy idempotent backfill write once per uid.
  const backfilledFor = useRef<string | null>(null);
  useEffect(() => {
    if (!uid || !db || !profile || backfilledFor.current === uid) return;
    const p = profile as StreakProfile;
    const needs =
      p.longestStreak == null ||
      p.lastActiveDate == null ||
      !p.timezone ||
      (p.streakFreezes != null && p.streakFreezes > 2);
    if (!needs) {
      backfilledFor.current = uid;
      return;
    }
    const filled = profileToStreak(p, todayKey);
    // Never reduce: only write fields that are missing or need capping.
    const patch: Record<string, unknown> = {
      timezone: filled.timezone,
      longestStreak: Math.max(p.longestStreak ?? 0, p.streak ?? 0),
      streakFreezes: filled.freezes,
    };
    if (p.lastActiveDate == null && filled.lastActiveDate) {
      patch.lastActiveDate = filled.lastActiveDate;
    }
    // Do not write `streak` downward.
    backfilledFor.current = uid;
    const firestore = db;
    runTransaction(firestore, async (tx) => {
      const ref = doc(firestore, 'users', uid);
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      const cur = snap.data() as StreakProfile;
      if (cur.longestStreak != null && cur.lastActiveDate != null && cur.timezone) return;
      tx.set(ref, {
        timezone: cur.timezone || patch.timezone,
        longestStreak: Math.max(cur.longestStreak ?? 0, cur.streak ?? 0, filled.longestStreak),
        streakFreezes: Math.min(2, cur.streakFreezes ?? filled.freezes),
        ...(cur.lastActiveDate == null && filled.lastActiveDate
          ? { lastActiveDate: filled.lastActiveDate }
          : {}),
      }, { merge: true });
    }).catch(() => { /* offline ok */ });
  }, [uid, profile, todayKey]);

  const repairStreak = useCallback(async () => {
    if (!uid || !db) return { ok: false as const, reason: 'not_configured' };
    const firestore = db;
    try {
      return await runTransaction(firestore, async (tx) => {
        const ref = doc(firestore, 'users', uid);
        const snap = await tx.get(ref);
        const p = (snap.data() as StreakProfile | undefined) ?? null;
        const nowMs = Date.now();
        const state = profileToStreak(p, localDateKey(new Date(nowMs), p?.timezone || timezone));
        if (!isRepairAvailable(state, nowMs)) {
          return { ok: false as const, reason: 'repair_unavailable' };
        }
        const coins = p?.coins ?? 0;
        if (coins < REPAIR_COIN_COST) {
          return { ok: false as const, reason: 'not_enough_coins' };
        }
        const repaired = applyStreakRepair(state, nowMs);
        if (!repaired) return { ok: false as const, reason: 'repair_unavailable' };

        tx.set(ref, {
          coins: coins - REPAIR_COIN_COST,
          streak: repaired.state.currentStreak,
          longestStreak: repaired.state.longestStreak,
          streakFreezes: repaired.state.freezes,
          lastActiveDate: repaired.state.lastActiveDate,
          repairAvailableUntil: null,
          pendingRepairStreak: null,
          timezone: repaired.state.timezone,
          updatedAt: serverTimestamp(),
        }, { merge: true });

        return { ok: true as const, streak: repaired.state.currentStreak };
      });
    } catch {
      return { ok: false as const, reason: 'failed' };
    }
  }, [uid, timezone]);

  // Warm timezone detection into profile if missing (read-only path uses getDoc).
  useEffect(() => {
    if (!uid || !db || !profile) return;
    const p = profile as StreakProfile;
    if (p.timezone) return;
    getDoc(doc(db, 'users', uid)).catch(() => {});
  }, [uid, profile]);

  return {
    streak,
    studiedToday: streak.lastActiveDate === todayKey,
    atRisk: isStreakAtRisk(streak, todayKey, localHour),
    canRepair: isRepairAvailable(streak, Date.now()),
    repairCost: REPAIR_COIN_COST,
    loading,
    repairStreak,
  };
}
