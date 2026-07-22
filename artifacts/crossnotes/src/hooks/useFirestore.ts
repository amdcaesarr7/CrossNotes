import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  increment,
  serverTimestamp,
  runTransaction,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ---- Types ----

export interface Subject {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  color: string; // CSS suffix: "science" | "math" | "lang" | "social" | "violet"
  bgColor?: string;
  isLive: boolean;
  description?: string;
}

export interface Chapter {
  id: string;
  name: string;
  description?: string;
  order: number;
  emoji?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  important?: boolean;
  order: number;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  order: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  points?: number;
  order: number;
}

export interface ActiveBoost {
  potionId: string;
  multiplier: number;
  expiresAt: Timestamp;
}

export interface UserProfile {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  xp: number;
  totalXp: number;
  streak: number;
  streakFreezes?: number; // banked "skip a day" tokens, earned every 5-day streak milestone
  coins?: number;         // shop currency, earned alongside XP
  inventory?: Record<string, number>; // potionId -> count owned, unused potions
  activeBoost?: ActiveBoost | null;    // currently-running XP multiplier, if any
  nickname?: string | null;            // cosmetic flex tag, unlocked via the shop
  lastStudied: Timestamp | null;
}

export interface UserProgress {
  notesRead?: boolean;
  flashcardsCompleted?: boolean;
  quizScore?: number;      // raw correct-answer count (kept for display, e.g. "7/10")
  quizMaxScore?: number;   // total questions in that attempt
  quizPct?: number;        // 0-100 — use this for averages/weak-chapter comparisons, NOT quizScore
  quizCompleted?: boolean;
  xpEarned?: number;
  subjectSlug?: string;   // stored on first write so Progress page can build links
  chapterName?: string;   // display name for weak-chapter cards
}

export interface LeaderboardEntry {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  xp: number;
  streak: number;
  nickname?: string | null;
}

// ---- XP Level helpers ----

const LEVELS = [
  { xp: 0,    name: "Fresh Start" },
  { xp: 100,  name: "Backbencher" },
  { xp: 300,  name: "Decent Human" },
  { xp: 600,  name: "Topper Wanna-be" },
  { xp: 1000, name: "Grind Mode" },
  { xp: 1500, name: "Sigma Studier" },
  { xp: 2500, name: "Board Slayer" },
  { xp: 4000, name: "Legend" },
];

export function getLevel(xp: number): { level: number; levelName: string; nextXp: number } {
  let level = 1;
  let levelName = LEVELS[0].name;
  let nextXp = LEVELS[1].xp;
  for (let i = 1; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].xp) {
      level = i + 1;
      levelName = LEVELS[i].name;
      nextXp = LEVELS[i + 1]?.xp ?? LEVELS[i].xp + 1000;
    }
  }
  return { level, levelName, nextXp };
}

// ---- Streak + streak-freeze logic ----
// A streak freeze covers exactly one missed calendar day without resetting the
// streak. Earned every 5-day streak milestone, capped so a long absence still
// eventually breaks the streak instead of it becoming meaningless.

export const MAX_STREAK_FREEZES = 3;
const STREAK_FREEZE_EVERY = 5;

/** Whole calendar days between two dates (not a raw 24h/ms division — avoids the
 *  classic bug where two sessions 20h apart on consecutive calendar days count
 *  as "same day" or vice versa). */
function calendarDaysBetween(from: Date, to: Date): number {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / 86400000);
}

export interface StreakUpdate {
  streak: number;
  streakFreezes: number;
  streakChanged: boolean;   // false = same calendar day as last study, nothing to do
  streakIncreased: boolean; // true = counts as "you kept your streak today"
  freezeUsed: boolean;
  freezeEarned: boolean;
}

export function computeStreakUpdate(
  currentStreak: number,
  currentFreezes: number,
  lastStudied: Date | null,
  now: Date,
): StreakUpdate {
  const freezesNow = currentFreezes || 0;

  if (!lastStudied) {
    return { streak: 1, streakFreezes: freezesNow, streakChanged: true, streakIncreased: true, freezeUsed: false, freezeEarned: false };
  }

  const daysSince = calendarDaysBetween(lastStudied, now);

  if (daysSince <= 0) {
    // Already studied today — streak itself doesn't move, only XP does.
    return { streak: currentStreak || 1, streakFreezes: freezesNow, streakChanged: false, streakIncreased: false, freezeUsed: false, freezeEarned: false };
  }

  const missedDays = daysSince - 1; // 0 = studied yesterday, consecutive
  let freezeUsed = false;
  let freezes = freezesNow;

  if (missedDays > 0) {
    if (freezes >= missedDays) {
      freezes -= missedDays;
      freezeUsed = true;
    } else {
      // Not enough banked freezes to cover the gap — streak resets.
      return { streak: 1, streakFreezes: freezes, streakChanged: true, streakIncreased: true, freezeUsed: false, freezeEarned: false };
    }
  }

  const newStreak = (currentStreak || 0) + 1;
  let freezeEarned = false;
  if (newStreak % STREAK_FREEZE_EVERY === 0 && freezes < MAX_STREAK_FREEZES) {
    freezes += 1;
    freezeEarned = true;
  }

  return { streak: newStreak, streakFreezes: freezes, streakChanged: true, streakIncreased: true, freezeUsed, freezeEarned };
}

// ---- Read hooks ----

export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!db) {
      setError(new Error("Firebase not configured"));
      setLoading(false);
      return;
    }
    getDocs(query(collection(db, "subjects"), orderBy("order", "asc")))
      .then((snap) => setSubjects(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Subject))))
      .catch((e) => setError(e))
      .finally(() => setLoading(false));
  }, []);

  return { subjects, loading, error };
}

export function useSubject(slug: string) {
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    if (!db) { setError(new Error("Firebase not configured")); setLoading(false); return; }
    getDocs(query(collection(db, "subjects"), orderBy("order", "asc")))
      .then((snap) => {
        const found = snap.docs.find((d) => d.data().slug === slug);
        setSubject(found ? ({ id: found.id, ...found.data() } as Subject) : null);
      })
      .catch((e) => setError(e))
      .finally(() => setLoading(false));
  }, [slug]);

  return { subject, loading, error };
}

export function useChapters(subjectId: string) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!db || !subjectId) { setLoading(false); return; }
    getDocs(query(collection(db, "subjects", subjectId, "chapters"), orderBy("order", "asc")))
      .then((snap) => setChapters(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Chapter))))
      .catch((e) => setError(e))
      .finally(() => setLoading(false));
  }, [subjectId]);

  return { chapters, loading, error };
}

export function useNotes(subjectId: string, chapterId: string) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!db || !subjectId || !chapterId) { setLoading(false); return; }
    getDocs(query(collection(db, "subjects", subjectId, "chapters", chapterId, "notes"), orderBy("order", "asc")))
      .then((snap) => setNotes(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Note))))
      .catch((e) => setError(e))
      .finally(() => setLoading(false));
  }, [subjectId, chapterId]);

  return { notes, loading, error };
}

export function useFlashcards(subjectId: string, chapterId: string) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!db || !subjectId || !chapterId) { setLoading(false); return; }
    getDocs(query(collection(db, "subjects", subjectId, "chapters", chapterId, "flashcards"), orderBy("order", "asc")))
      .then((snap) => setFlashcards(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Flashcard))))
      .catch((e) => setError(e))
      .finally(() => setLoading(false));
  }, [subjectId, chapterId]);

  return { flashcards, loading, error };
}

export function useQuiz(subjectId: string, chapterId: string) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!subjectId || !chapterId) { setLoading(false); return; }
    if (!db) { setError(new Error("Firebase not configured")); setLoading(false); return; }
    getDocs(query(collection(db, "subjects", subjectId, "chapters", chapterId, "quiz"), orderBy("order", "asc")))
      .then((snap) => setQuestions(snap.docs.map((d) => ({ id: d.id, ...d.data() } as QuizQuestion))))
      .catch((e) => setError(e))
      .finally(() => setLoading(false));
  }, [subjectId, chapterId]);

  return { questions, loading, error };
}

export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!db) { setLoading(false); return; }
    const q = query(collection(db, "leaderboard"), orderBy("xp", "desc"), limit(25));
    const unsub = onSnapshot(q, (snap) => {
      setEntries(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as LeaderboardEntry)));
      setLoading(false);
    }, (e) => { setError(e); setLoading(false); });
    return unsub;
  }, []);

  return { entries, loading, error };
}

export function useUserProfile(uid: string | undefined) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!uid) { setLoading(false); return; }
    if (!db) { setError(new Error("Firebase not configured")); setLoading(false); return; }
    setLoading(true);
    // Real-time listener, not a one-shot getDoc — without this, things like
    // the header's coin count or an active potion boost never update unless
    // the whole component happens to remount (e.g. buying a potion on the
    // Shop page doesn't navigate anywhere, so a one-shot fetch would just
    // show stale coins forever after the purchase).
    const unsubscribe = onSnapshot(
      doc(db, "users", uid),
      (snap) => { setProfile(snap.exists() ? (snap.data() as UserProfile) : null); setLoading(false); },
      (e) => { setError(e); setLoading(false); },
    );
    return unsubscribe;
  }, [uid]);

  return { profile, loading, error };
}

export function useUserProgress(uid: string | undefined, chapterId: string | undefined) {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!uid || !chapterId) { setLoading(false); return; }
    if (!db) { setError(new Error("Firebase not configured")); setLoading(false); return; }
    getDoc(doc(db, "users", uid, "progress", chapterId))
      .then((snap) => { if (snap.exists()) setProgress(snap.data() as UserProgress); })
      .catch((e) => setError(e))
      .finally(() => setLoading(false));
  }, [uid, chapterId]);

  return { progress, loading, error };
}

export function useAllUserProgress(uid: string | undefined) {
  const [progressMap, setProgressMap] = useState<Record<string, UserProgress>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !uid) { setLoading(false); return; }
    getDocs(collection(db, "users", uid, "progress"))
      .then((snap) => {
        const map: Record<string, UserProgress> = {};
        snap.docs.forEach((d) => { map[d.id] = d.data() as UserProgress; });
        setProgressMap(map);
      })
      .finally(() => setLoading(false));
  }, [uid]);

  return { progressMap, loading };
}

// ---- Write helpers (idempotent via Firestore transactions) ----
//
// Each XP-earning action also updates the streak, atomically, in the same
// transaction. (Previously the app had a separate `updateStreak` function
// that nothing ever called — the streak field was dead code. It's folded in
// here so streak/freeze state always reflects real activity.)

export interface ActivityResult {
  xp: number;              // XP actually credited THIS action (post-boost, 0 if already claimed today)
  boostMultiplier: number; // 1 if no boost was active
  coinsEarned: number;
  leveledUp: boolean;
  levelName?: string;      // new level name, only set if leveledUp
  streak: number;
  streakIncreased: boolean;
  streakFreezes: number;
  streakFreezeUsed: boolean;
  streakFreezeEarned: boolean;
}

const NOOP_RESULT: ActivityResult = {
  xp: 0, boostMultiplier: 1, coinsEarned: 0, leveledUp: false, streak: 0, streakIncreased: false,
  streakFreezes: 0, streakFreezeUsed: false, streakFreezeEarned: false,
};

/** 1 coin per 5 XP earned (pre-boost — coins aren't affected by XP potions,
 *  only actual study effort is), minimum 1 whenever any XP was earned. */
function coinsForXp(xp: number): number {
  return xp > 0 ? Math.max(1, Math.round(xp / 5)) : 0;
}

/** Reads the user profile inside the transaction, applies XP + streak update, writes back. */
interface XpComputation {
  userPatch: Record<string, unknown>;
  lbPatch: Record<string, unknown>;
  result: ActivityResult;
}

/** Pure computation — no tx calls here. Firestore transactions require every
 *  read to happen before any write, so the caller must tx.get(userRef) itself
 *  (before touching progressRef with a write) and hand the profile in here. */
function computeXpAndStreak(profile: UserProfile | null, baseXp: number): XpComputation {
  const prevXp = profile?.xp ?? 0; // level is always displayed from `xp` elsewhere in the app — keep this consistent
  const now = new Date();
  const lastStudied = profile?.lastStudied?.toDate() ?? null;

  const su = computeStreakUpdate(profile?.streak ?? 0, profile?.streakFreezes ?? 0, lastStudied, now);

  // Active XP-boost potion, if any and not expired. Self-cleans once spent.
  const boost = profile?.activeBoost ?? null;
  const boostStillActive = !!boost && boost.expiresAt.toDate() > now;
  const boostMultiplier = boostStillActive ? boost!.multiplier : 1;
  const xp = Math.round(baseXp * boostMultiplier);
  const coinsEarned = coinsForXp(baseXp); // coins track real effort, not the XP potion multiplier

  const newXpTotal = prevXp + xp;
  const prevLevel = getLevel(prevXp).level;
  const nextLevel = getLevel(newXpTotal);
  const leveledUp = xp > 0 && nextLevel.level > prevLevel;

  const userPatch: Record<string, unknown> = {
    xp: increment(xp),
    totalXp: increment(xp),
    coins: increment(coinsEarned),
    streak: su.streak,
    streakFreezes: su.streakFreezes,
    lastStudied: serverTimestamp(),
    // A boost that already expired gets cleared here rather than needing a
    // separate cleanup job — the next XP-earning action tidies it up.
    ...(boost && !boostStillActive ? { activeBoost: null } : {}),
  };

  const lbPatch: Record<string, unknown> = {
    xp: increment(xp),
    streak: su.streak,
    updatedAt: serverTimestamp(),
  };

  return {
    userPatch,
    lbPatch,
    result: {
      xp,
      boostMultiplier,
      coinsEarned,
      leveledUp,
      levelName: leveledUp ? nextLevel.levelName : undefined,
      streak: su.streak,
      streakIncreased: su.streakIncreased,
      streakFreezes: su.streakFreezes,
      streakFreezeUsed: su.freezeUsed,
      streakFreezeEarned: su.freezeEarned,
    },
  };
}

export async function markNotesRead(
  uid: string,
  chapterId: string,
  meta?: { subjectSlug?: string; chapterName?: string },
): Promise<ActivityResult> {
  if (!db) return NOOP_RESULT;
  const progressRef = doc(db, "users", uid, "progress", chapterId);
  const userRef = doc(db, "users", uid);
  const lbRef = doc(db, "leaderboard", uid);
  const XP = 10;

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(progressRef);
    if (snap.data()?.notesRead) return NOOP_RESULT;

    const userSnap = await tx.get(userRef); // read BEFORE any writes — Firestore requires this ordering
    const profile = (userSnap.data() as UserProfile | undefined) ?? null;
    const { userPatch, lbPatch, result } = computeXpAndStreak(profile, XP);

    tx.set(progressRef, { notesRead: true, ...meta }, { merge: true });
    tx.set(userRef, userPatch, { merge: true });
    tx.set(lbRef, lbPatch, { merge: true });
    return result;
  });
}

export async function markFlashcardsCompleted(
  uid: string,
  chapterId: string,
  meta?: { subjectSlug?: string; chapterName?: string },
): Promise<ActivityResult> {
  if (!db) return NOOP_RESULT;
  const progressRef = doc(db, "users", uid, "progress", chapterId);
  const userRef = doc(db, "users", uid);
  const lbRef = doc(db, "leaderboard", uid);
  const XP = 20;

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(progressRef);
    if (snap.data()?.flashcardsCompleted) return NOOP_RESULT;

    const userSnap = await tx.get(userRef); // read BEFORE any writes — Firestore requires this ordering
    const profile = (userSnap.data() as UserProfile | undefined) ?? null;
    const { userPatch, lbPatch, result } = computeXpAndStreak(profile, XP);

    tx.set(progressRef, { flashcardsCompleted: true, ...meta }, { merge: true });
    tx.set(userRef, userPatch, { merge: true });
    tx.set(lbRef, lbPatch, { merge: true });
    return result;
  });
}

export async function saveQuizScore(
  uid: string,
  chapterId: string,
  score: number,
  maxScore: number,
  meta?: { subjectSlug?: string; chapterName?: string },
): Promise<ActivityResult> {
  if (!db) return NOOP_RESULT;
  const progressRef = doc(db, "users", uid, "progress", chapterId);
  const userRef = doc(db, "users", uid);
  const lbRef = doc(db, "leaderboard", uid);
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const newXp = Math.round((pct / 100) * 50);

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(progressRef);
    const data = snap.data();

    if (data?.quizCompleted) {
      // Retake: only ever improve the recorded best score, never re-award XP/streak.
      if (score > (data.quizScore ?? 0)) {
        tx.set(progressRef, { quizScore: score, quizMaxScore: maxScore, quizPct: pct }, { merge: true });
      }
      return NOOP_RESULT;
    }

    const userSnap = await tx.get(userRef); // read BEFORE any writes — Firestore requires this ordering
    const profile = (userSnap.data() as UserProfile | undefined) ?? null;
    const { userPatch, lbPatch, result } = computeXpAndStreak(profile, newXp);

    tx.set(progressRef, { quizScore: score, quizMaxScore: maxScore, quizPct: pct, quizCompleted: true, xpEarned: newXp, ...meta }, { merge: true });
    tx.set(userRef, userPatch, { merge: true });
    tx.set(lbRef, lbPatch, { merge: true });
    return result;
  });
}

// ---- Shop: coins, inventory, potions ----

export type PurchaseResult =
  | { ok: true; coinsLeft: number }
  | { ok: false; reason: "not_enough_coins" | "not_configured" };

export async function buyPotion(uid: string, potionId: string, cost: number): Promise<PurchaseResult> {
  if (!db) return { ok: false, reason: "not_configured" };
  const userRef = doc(db, "users", uid);

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    const profile = (snap.data() as UserProfile | undefined) ?? null;
    const coins = profile?.coins ?? 0;

    if (coins < cost) return { ok: false, reason: "not_enough_coins" };

    const inventory = { ...(profile?.inventory ?? {}) };
    inventory[potionId] = (inventory[potionId] ?? 0) + 1;

    tx.set(userRef, { coins: increment(-cost), inventory }, { merge: true });
    return { ok: true, coinsLeft: coins - cost };
  });
}

export type UsePotionResult =
  | { ok: true; kind: "xp_boost"; expiresAt: Date }
  | { ok: true; kind: "streak_shield"; streakFreezes: number }
  | { ok: false; reason: "none_owned" | "not_configured" };

export async function usePotion(
  uid: string,
  potionId: string,
  potionMeta: { kind: "xp_boost" | "streak_shield"; multiplier: number; durationMin: number },
): Promise<UsePotionResult> {
  if (!db) return { ok: false, reason: "not_configured" };
  const userRef = doc(db, "users", uid);

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    const profile = (snap.data() as UserProfile | undefined) ?? null;
    const owned = profile?.inventory?.[potionId] ?? 0;

    if (owned <= 0) return { ok: false, reason: "none_owned" };

    const inventory = { ...(profile?.inventory ?? {}) };
    inventory[potionId] = owned - 1;

    if (potionMeta.kind === "streak_shield") {
      const freezes = Math.min(MAX_STREAK_FREEZES, (profile?.streakFreezes ?? 0) + 1);
      tx.set(userRef, { inventory, streakFreezes: freezes }, { merge: true });
      return { ok: true, kind: "streak_shield", streakFreezes: freezes };
    }

    const expiresAt = Timestamp.fromMillis(Date.now() + potionMeta.durationMin * 60_000);
    const activeBoost: ActiveBoost = { potionId, multiplier: potionMeta.multiplier, expiresAt };
    tx.set(userRef, { inventory, activeBoost }, { merge: true });
    return { ok: true, kind: "xp_boost", expiresAt: expiresAt.toDate() };
  });
}

const NICKNAME_MAX_LEN = 18;

export function sanitizeNickname(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, NICKNAME_MAX_LEN);
}

export type NicknameResult =
  | { ok: true; nickname: string }
  | { ok: false; reason: "none_owned" | "empty" | "not_configured" };

/** Consumes 1 Nickname Tag from inventory and sets the flex tag — mirrored to
 *  the leaderboard doc too so it actually shows up where people will see it. */
export async function redeemNicknameTag(uid: string, rawNickname: string): Promise<NicknameResult> {
  if (!db) return { ok: false, reason: "not_configured" };
  const nickname = sanitizeNickname(rawNickname);
  if (!nickname) return { ok: false, reason: "empty" };

  const userRef = doc(db, "users", uid);
  const lbRef = doc(db, "leaderboard", uid);

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    const profile = (snap.data() as UserProfile | undefined) ?? null;
    const owned = profile?.inventory?.["nickname_tag"] ?? 0;

    if (owned <= 0) return { ok: false, reason: "none_owned" };

    const inventory = { ...(profile?.inventory ?? {}) };
    inventory["nickname_tag"] = owned - 1;

    tx.set(userRef, { inventory, nickname }, { merge: true });
    tx.set(lbRef, { nickname }, { merge: true });
    return { ok: true, nickname };
  });
}
