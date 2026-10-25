import React, { useEffect, useRef } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useMew } from '@/contexts/MewContext';
import Mew from '@/components/Mew';

/**
 * MewStudyBuddy — persistent bottom-right mascot widget.
 *
 * Layout:
 *   • Fixed corner widget: Mew SVG + speech bubble + mute toggle
 *   • Full-screen celebration modal when isCelebrating = true
 */
export default function MewStudyBuddy() {
  const { mood, bubble, isMuted, isCelebrating, boopCount, boop, toggleMute, dismissCelebration } = useMew();
  const boopRef = useRef(boopCount);

  // When boopCount changes, the Mew SVG's internal spring is already
  // triggered via the onClick prop — we just need to log for debugging.
  useEffect(() => { boopRef.current = boopCount; }, [boopCount]);

  return (
    <>
      {/* ── Persistent corner widget ─────────────────────────────────────── */}
      <div
        className="mew-buddy"
        role="complementary"
        aria-label="Mew, your study buddy"
      >
        {/* Speech bubble — slides in above Mew */}
        {bubble && !isMuted && (
          <div
            key={bubble.id}
            className="mew-bubble"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <p className="mew-bubble__text">{bubble.text}</p>
            <div className="mew-bubble__tail" aria-hidden="true" />
          </div>
        )}

        {/* Mute toggle — floats top-right of the widget */}
        <button
          className="mew-mute-btn"
          onClick={toggleMute}
          aria-label={isMuted ? 'Wake Mew up' : 'Put Mew to sleep'}
          title={isMuted ? 'Wake Mew up (｡•́ᴗ•̀｡)' : 'Shhh... let Mew nap (zzz)'}
        >
          {isMuted ? <Sun size={13} /> : <Moon size={13} />}
        </button>

        {/* The mascot itself */}
        <div className={`mew-buddy__mascot ${isMuted ? 'mew-buddy__mascot--sleeping' : ''}`}>
          <Mew
            mood={isMuted ? 'idle' : mood}
            size={88}
            onClick={boop}
          />
        </div>

        {!isMuted && (
          <p className="mew-buddy__label">
            {mood === 'sad' ? '(｡•́︿•̀｡)' : mood === 'thinking' ? '(´・ω・`)' : '(๑>ᴗ<๑)'}
          </p>
        )}
        {isMuted && (
          <p className="mew-buddy__label mew-buddy__label--sleeping">
            z z z
          </p>
        )}
      </div>

      {/* ── Full-screen celebration modal ────────────────────────────────── */}
      {isCelebrating && (
        <div
          className="mew-celebration-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Mew's celebration"
          onClick={dismissCelebration}
        >
          <div className="mew-celebration-card" onClick={e => e.stopPropagation()}>
            <Mew mood="celebrate" size={180} onClick={boop} />
            {bubble && (
              <p className="mew-celebration__text">{bubble.text}</p>
            )}
            <button
              className="mew-celebration__dismiss clay-btn"
              onClick={dismissCelebration}
            >
              *happy wiggle* Let's keep going!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
