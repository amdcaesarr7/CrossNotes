import React, { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { MituMood } from '@/components/Mew';
import { MewDialogue, type MewTrigger } from '@/lib/MewDialogue';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MewBubble {
  text: string;
  duration: number;
  id: number;
}

export interface MewState {
  mood: MituMood;
  bubble: MewBubble | null;
  isMuted: boolean;
  isCelebrating: boolean;
  /** Boop poke counter — the Mew SVG component watches this to spring. */
  boopCount: number;
}

export interface MewContextValue extends MewState {
  /** Trigger a named dialogue line and optionally switch mood. */
  trigger: (t: MewTrigger, mood?: MituMood) => void;
  /** Directly set Mew's mood without a speech bubble. */
  setMood: (m: MituMood) => void;
  /** User clicked Mew — boop physics + optional rare reward. */
  boop: () => void;
  /** User put Mew to sleep / woke her up. */
  toggleMute: () => void;
  /** Full-screen celebration — shown after quiz completion. */
  celebrate: (onDone?: () => void) => void;
  dismissCelebration: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BOOP_RARE_CHANCE = 0.08; // 8% chance of rare reward on boop
const IDLE_NUDGE_INTERVAL_MS = 45_000; // 45 s between idle whispers
const STREAK_WARN_HOUR = 19; // 7 PM

// ─── Context ──────────────────────────────────────────────────────────────────

const MewContext = createContext<MewContextValue | null>(null);

let bubbleSeq = 0;

export function MewProvider({ children, streak = 0, studiedToday = false }: {
  children: ReactNode;
  streak?: number;
  studiedToday?: boolean;
}) {
  const [mood, setMoodState] = useState<MituMood>('idle');
  const [bubble, setBubble] = useState<MewBubble | null>(null);
  const [isMuted, setIsMuted] = useState(() => {
    try { return localStorage.getItem('mew-muted') === 'true'; } catch { return false; }
  });
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [boopCount, setBoopCount] = useState(0);

  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const celebrationDoneRef = useRef<(() => void) | undefined>(undefined);

  // ── helpers ──────────────────────────────────────────────────────────────

  const showBubble = useCallback((text: string, duration: number) => {
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    const id = ++bubbleSeq;
    setBubble({ text, duration, id });
    bubbleTimer.current = setTimeout(() => setBubble(null), duration);
  }, []);

  const setMood = useCallback((m: MituMood) => {
    setMoodState(m);
  }, []);

  const trigger = useCallback((t: MewTrigger, overrideMood?: MituMood) => {
    if (isMuted && t !== 'muted' && t !== 'unmuted') return;
    const line = MewDialogue[t]();
    showBubble(line.text, line.duration ?? 7000);
    if (overrideMood) setMoodState(overrideMood);
  }, [isMuted, showBubble]);

  const boop = useCallback(() => {
    setBoopCount(c => c + 1);
    const isRare = Math.random() < BOOP_RARE_CHANCE;
    if (isRare) {
      trigger('boopRare', 'celebrate');
      // After rare reward, return to happy after bubble fades
      setTimeout(() => setMoodState('happy'), 9000);
    } else {
      trigger('boop', 'happy');
      setTimeout(() => setMoodState('idle'), 5000);
    }
  }, [trigger]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      try { localStorage.setItem('mew-muted', String(next)); } catch { /* noop */ }
      if (next) {
        // Going muted: show goodbye bubble BEFORE silencing
        const line = MewDialogue.muted();
        showBubble(line.text, line.duration ?? 7000);
        setMoodState('idle');
      } else {
        // Waking up
        setMoodState('happy');
        setTimeout(() => {
          const line = MewDialogue.unmuted();
          showBubble(line.text, line.duration ?? 6000);
        }, 300);
      }
      return next;
    });
  }, [showBubble]);

  const celebrate = useCallback((onDone?: () => void) => {
    celebrationDoneRef.current = onDone;
    setMoodState('celebrate');
    setIsCelebrating(true);
    const line = MewDialogue.celebrate();
    showBubble(line.text, line.duration ?? 8000);
  }, [showBubble]);

  const dismissCelebration = useCallback(() => {
    setIsCelebrating(false);
    setMoodState('happy');
    celebrationDoneRef.current?.();
    celebrationDoneRef.current = undefined;
  }, []);

  // ── Streak warning (after 7 PM, if not studied) ───────────────────────────

  useEffect(() => {
    if (isMuted || studiedToday) return undefined;
    const now = new Date();
    const hour = now.getHours();
    if (hour >= STREAK_WARN_HOUR) {
      // Delay 3s so page has settled
      const t = setTimeout(() => {
        setMoodState('sad');
        trigger('streakWarning');
      }, 3000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [studiedToday, isMuted, trigger]);

  // ── Page-load greeting ────────────────────────────────────────────────────

  useEffect(() => {
    if (isMuted) return;
    const t = setTimeout(() => {
      trigger('pageLoad', 'idle');
    }, 1500);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // ── Idle whispers ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (isMuted) return;
    const id = setInterval(() => {
      if (mood === 'idle' && !bubble) {
        trigger('idle');
      }
    }, IDLE_NUDGE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isMuted, mood, bubble, trigger]);

  return (
    <MewContext.Provider value={{
      mood, bubble, isMuted, isCelebrating, boopCount,
      trigger, setMood, boop, toggleMute, celebrate, dismissCelebration,
    }}>
      {children}
    </MewContext.Provider>
  );
}

export function useMew(): MewContextValue {
  const ctx = useContext(MewContext);
  if (!ctx) throw new Error('useMew must be used inside <MewProvider>');
  return ctx;
}
