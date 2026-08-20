import { useEffect, useRef } from 'react';
import {
  getLastActiveAt,
  markCrossNotesActive,
  maybeShowMewAwayNotification,
  type MewNudgeReason,
} from '@/lib/notifications';

const SHORT_DETOUR_MS = 90 * 1000;
const LONG_ABSENCE_MS = 6 * 60 * 60 * 1000;

interface UseMewPresenceOptions {
  onNudge: (reason: MewNudgeReason) => void;
}

/**
 * Detects time away from CrossNotes only. Browser privacy protections do not
 * let a site identify another tab or app, so a hidden CrossNotes tab is framed
 * as a possible scroll detour rather than pretending to know the destination.
 */
export function useMewPresence({ onNudge }: UseMewPresenceOptions) {
  const onNudgeRef = useRef(onNudge);

  useEffect(() => {
    onNudgeRef.current = onNudge;
  }, [onNudge]);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const reportNudge = (reason: MewNudgeReason) => {
      onNudgeRef.current(reason);
      maybeShowMewAwayNotification(reason);
    };

    const lastActive = getLastActiveAt();
    const wasAwayLong = !!lastActive && Date.now() - lastActive >= LONG_ABSENCE_MS;
    let hiddenAt: number | null = document.visibilityState === 'hidden' ? Date.now() : null;

    markCrossNotesActive();
    if (wasAwayLong) {
      window.setTimeout(() => reportNudge('long-absence'), 700);
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
        return;
      }

      const now = Date.now();
      const previousActive = getLastActiveAt();
      const durationAway = hiddenAt ? now - hiddenAt : previousActive ? now - previousActive : 0;
      const reason: MewNudgeReason | null = durationAway >= LONG_ABSENCE_MS
        ? 'long-absence'
        : durationAway >= SHORT_DETOUR_MS
          ? 'social-detour'
          : null;

      markCrossNotesActive(now);
      hiddenAt = null;
      if (reason) reportNudge(reason);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
}
