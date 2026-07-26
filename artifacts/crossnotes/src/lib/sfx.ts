/**
 * Lightweight sound effects, synthesized with the Web Audio API.
 *
 * Why synthesized instead of downloaded clips (e.g. from freesound.org)?
 *  - Zero network requests → can never 404, hang on a slow connection, or
 *    break because a hosted file moved.
 *  - No CORS, hosting, licensing, or attribution concerns.
 *  - This entire file is a few hundred bytes vs. shipping multiple audio assets.
 *  - Plays instantly — nothing to preload.
 *
 * Every public function is defensive: if Web Audio isn't available, or audio
 * is blocked before a user gesture, calls silently no-op. Sound here is
 * decoration — it must never throw or break the app.
 */

type OscType = OscillatorType;

let ctx: AudioContext | null = null;
let soundEnabled = true;

function getCtx(): AudioContext | null {
  if (ctx) return ctx;
  try {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    return ctx;
  } catch {
    return null;
  }
}

/** Call from a user-gesture handler (once) to unlock audio on iOS/Safari. */
export function unlockAudio() {
  const c = getCtx();
  if (c && c.state === "suspended") c.resume().catch(() => {});
}

export function setSoundEnabled(v: boolean) {
  soundEnabled = v;
}

export function getSoundEnabled() {
  return soundEnabled;
}

function tone(
  freq: number,
  startOffset: number,
  duration: number,
  opts: { type?: OscType; peakGain?: number; slideTo?: number } = {},
) {
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") c.resume().catch(() => {});

  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = opts.type ?? "sine";

  const t0 = c.currentTime + startOffset;
  osc.frequency.setValueAtTime(freq, t0);
  if (opts.slideTo) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.slideTo), t0 + duration);
  }

  const peak = opts.peakGain ?? 0.18;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(peak, t0 + Math.min(0.02, duration / 4));
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function guarded(fn: () => void) {
  if (!soundEnabled) return;
  try {
    fn();
  } catch {
    // sound is best-effort only — never let it break the app
  }
}

export const sfx = {
  /** Short upward "ding" for a correct quiz answer. */
  correct() {
    guarded(() => {
      tone(660, 0, 0.09, { peakGain: 0.16 });
      tone(880, 0.09, 0.14, { peakGain: 0.18 });
    });
  },
  /** Short downward buzz for a wrong quiz answer. */
  wrong() {
    guarded(() => {
      tone(220, 0, 0.16, { type: "square", peakGain: 0.11, slideTo: 130 });
    });
  },
  /** Soft tick for flipping a flashcard. */
  flip() {
    guarded(() => {
      tone(520, 0, 0.06, { type: "triangle", peakGain: 0.07, slideTo: 720 });
    });
  },
  /** Tiny click for minor UI taps. */
  click() {
    guarded(() => {
      tone(750, 0, 0.04, { peakGain: 0.05 });
    });
  },
  /** Bigger 4-note fanfare for a level-up. */
  levelUp() {
    guarded(() => {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
        tone(f, i * 0.09, 0.16, { type: "triangle", peakGain: 0.16 }),
      );
    });
  },
  /** Gentle 3-note chime for hitting a streak milestone. */
  streakMilestone() {
    guarded(() => {
      [440, 554.37, 659.25].forEach((f, i) => tone(f, i * 0.1, 0.18, { peakGain: 0.15 }));
    });
  },
  /** Reassuring "shield" swoosh when a streak freeze saves the day. */
  streakSaved() {
    guarded(() => {
      tone(392, 0, 0.12, { peakGain: 0.1, slideTo: 523 });
      tone(659, 0.1, 0.18, { peakGain: 0.14 });
    });
  },
};
