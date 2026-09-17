import { useId, useState } from 'react';

export type MewMood = 'cheery' | 'excited' | 'proud' | 'judgy' | 'sleepy' | 'studying';

export interface MewMascotProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  mood?: MewMood;
  variant?: 'classic' | 'sunset' | 'cosmic' | 'berry';
  interactive?: boolean;
  speech?: string;
  className?: string;
  onClick?: () => void;
}

/** Palette definitions matching the watercolor sketch from user attachments. */
const PALETTES = {
  classic: {
    bodyTop: '#ffffff',
    bodyBottom: '#f3e8fa',
    leafLeftTop: '#5b4b9b',
    leafLeftBottom: '#3e3170',
    leafRightTop: '#7c6bb5',
    leafRightBottom: '#514285',
    leafVein: '#a89bd4',
    blush: '#ff8a93',
    eye: '#22193b',
    belly: '#ffffff',
    shadow: '#d2c2e6',
  },
  sunset: {
    bodyTop: '#fff8f0',
    bodyBottom: '#ffe4c4',
    leafLeftTop: '#8c331a',
    leafLeftBottom: '#591f10',
    leafRightTop: '#b54e24',
    leafRightBottom: '#7c3114',
    leafVein: '#f09b7d',
    blush: '#ff6b6b',
    eye: '#2b150c',
    belly: '#fff5eb',
    shadow: '#ebd0b9',
  },
  cosmic: {
    bodyTop: '#f4f0ff',
    bodyBottom: '#dcd0ff',
    leafLeftTop: '#2b2353',
    leafLeftBottom: '#181236',
    leafRightTop: '#42367a',
    leafRightBottom: '#281f4f',
    leafVein: '#8c7cd4',
    blush: '#ff75b5',
    eye: '#16102e',
    belly: '#fbf9ff',
    shadow: '#c4b3f0',
  },
  berry: {
    bodyTop: '#fff0f5',
    bodyBottom: '#ffd6e7',
    leafLeftTop: '#4a233b',
    leafLeftBottom: '#2b1221',
    leafRightTop: '#703458',
    leafRightBottom: '#481d37',
    leafVein: '#c784ad',
    blush: '#ff5487',
    eye: '#260e1c',
    belly: '#fff8fb',
    shadow: '#e8b8ce',
  },
};

const TAP_SPEECHES = [
  "You've got this! Keep going! ✨",
  "One step closer to 100%! 💯",
  "Mew believes in you! 🌿",
  "Study hard, rest well! 🌟",
  "Toppers don't wait, let's grind! 🔥",
];

export default function MewMascot({
  size = 'md',
  mood = 'cheery',
  variant = 'classic',
  interactive = true,
  speech,
  className = '',
  onClick,
}: MewMascotProps) {
  const uid = useId().replace(/:/g, '');
  const [tapSpeechIndex, setTapSpeechIndex] = useState<number | null>(null);
  const [isTapped, setIsTapped] = useState(false);

  const colors = PALETTES[variant] || PALETTES.classic;

  const bodyGrad = `mew-body-${uid}`;
  const leafLGrad = `mew-leaf-l-${uid}`;
  const leafRGrad = `mew-leaf-r-${uid}`;

  const handleTap = () => {
    if (interactive) {
      setIsTapped(true);
      setTapSpeechIndex((prev) => (prev === null ? 0 : (prev + 1) % TAP_SPEECHES.length));
      setTimeout(() => setIsTapped(false), 500);
    }
    if (onClick) onClick();
  };

  const activeSpeech = speech ?? (tapSpeechIndex !== null ? TAP_SPEECHES[tapSpeechIndex] : null);

  return (
    <div
      className={`mew-mascot-wrapper mew-mascot--${size} mew-mascot--${mood} ${
        isTapped ? 'mew-bounce-pop' : ''
      } ${className}`}
      onClick={handleTap}
      style={{ cursor: interactive || onClick ? 'pointer' : 'default' }}
      role={interactive ? 'button' : 'img'}
      aria-label={`Mew study companion, looking ${mood}`}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={(e) => {
        if (interactive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleTap();
        }
      }}
    >
      {/* Dynamic Speech Bubble */}
      {activeSpeech && (
        <div className="mew-speech-bubble animate-pop-in">
          <span>{activeSpeech}</span>
        </div>
      )}

      <svg
        className="mew-mascot__svg"
        viewBox="0 0 120 135"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id={bodyGrad} x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor={colors.bodyTop} />
            <stop offset="100%" stopColor={colors.bodyBottom} />
          </linearGradient>
          <linearGradient id={leafLGrad} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={colors.leafLeftTop} />
            <stop offset="100%" stopColor={colors.leafLeftBottom} />
          </linearGradient>
          <linearGradient id={leafRGrad} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={colors.leafRightTop} />
            <stop offset="100%" stopColor={colors.leafRightBottom} />
          </linearGradient>

          <filter id={`shadow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="4" floodColor="#3c2463" floodOpacity="0.18" />
          </filter>
        </defs>

        {/* Soft Ground Shadow */}
        <ellipse cx="60" cy="122" rx="34" ry="7" fill={colors.shadow} opacity="0.45" />

        {/* --- LEAF EARS / WINGS (Tilted & Textured) --- */}
        <g className="mew-leaves-group">
          {/* Left Leaf Sprout */}
          <g className="mew-leaf-left">
            <path
              d="M 52 32 C 25 8, 8 28, 48 42 Z"
              fill={`url(#${leafLGrad})`}
              stroke="#201538"
              strokeWidth="2.4"
              strokeLinejoin="round"
            />
            {/* Leaf Veins */}
            <path d="M 45 40 Q 28 25 20 22" fill="none" stroke={colors.leafVein} strokeWidth="1.8" strokeLinecap="round" />
            <path d="M 36 32 Q 30 24 24 23" fill="none" stroke={colors.leafVein} strokeWidth="1.4" strokeLinecap="round" />
            <path d="M 42 37 Q 38 31 34 30" fill="none" stroke={colors.leafVein} strokeWidth="1.4" strokeLinecap="round" />
          </g>

          {/* Right Leaf Sprout */}
          <g className="mew-leaf-right">
            <path
              d="M 68 32 C 95 8, 112 28, 72 42 Z"
              fill={`url(#${leafRGrad})`}
              stroke="#201538"
              strokeWidth="2.4"
              strokeLinejoin="round"
            />
            {/* Leaf Veins */}
            <path d="M 75 40 Q 92 25 100 22" fill="none" stroke={colors.leafVein} strokeWidth="1.8" strokeLinecap="round" />
            <path d="M 84 32 Q 90 24 96 23" fill="none" stroke={colors.leafVein} strokeWidth="1.4" strokeLinecap="round" />
            <path d="M 78 37 Q 82 31 86 30" fill="none" stroke={colors.leafVein} strokeWidth="1.4" strokeLinecap="round" />
          </g>
        </g>

        {/* Stubby Feet */}
        <g stroke="#201538" strokeWidth="2.5" strokeLinejoin="round" fill={`url(#${bodyGrad})`}>
          <path d="M 38 106 C 36 120, 48 120, 48 108 Z" />
          <path d="M 72 108 C 72 120, 84 120, 82 106 Z" />
        </g>

        {/* Stubby Nubs (Little Side Arms) */}
        <g stroke="#201538" strokeWidth="2.3" strokeLinejoin="round" fill={`url(#${bodyGrad})`}>
          <ellipse cx="21" cy="76" rx="7.5" ry="9" transform="rotate(-15 21 76)" />
          <ellipse cx="99" cy="76" rx="7.5" ry="9" transform="rotate(15 99 76)" />
        </g>

        {/* MAIN SQUISHY ROUND BODY */}
        <path
          d="M 60 30 C 92 30, 106 54, 104 80 C 102 106, 84 114, 60 114 C 36 114, 18 106, 16 80 C 14 54, 28 30, 60 30 Z"
          fill={`url(#${bodyGrad})`}
          stroke="#201538"
          strokeWidth="2.8"
          strokeLinejoin="round"
          filter={`url(#shadow-${uid})`}
        />

        {/* Soft Tummy Patch */}
        <ellipse cx="60" cy="85" rx="26" ry="20" fill={colors.belly} opacity="0.65" />

        {/* Rosy Watercolor Blush Cheeks */}
        <ellipse cx="33" cy="72" rx="9" ry="5.5" fill={colors.blush} opacity="0.82" />
        <ellipse cx="87" cy="72" rx="9" ry="5.5" fill={colors.blush} opacity="0.82" />

        {/* Sparkle Highlight on Cheek */}
        <circle cx="28" cy="70" r="1.5" fill="#ffffff" opacity="0.8" />
        <circle cx="92" cy="70" r="1.5" fill="#ffffff" opacity="0.8" />

        {/* --- EYES & EXPRESSIONS PER MOOD --- */}
        {mood === 'cheery' && (
          <g className="mew-face">
            {/* Cute big glossy eyes */}
            <ellipse cx="43" cy="62" rx="6.5" ry="8.5" fill={colors.eye} />
            <ellipse cx="77" cy="62" rx="6.5" ry="8.5" fill={colors.eye} />
            <circle cx="41" cy="58" r="2.8" fill="#ffffff" />
            <circle cx="75" cy="58" r="2.8" fill="#ffffff" />
            <circle cx="45" cy="65" r="1.2" fill="#ffffff" opacity="0.7" />
            <circle cx="79" cy="65" r="1.2" fill="#ffffff" opacity="0.7" />

            {/* w-mouth */}
            <path
              d="M 52 70 Q 56 75 60 70 Q 64 75 68 70"
              fill="none"
              stroke={colors.eye}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        )}

        {mood === 'excited' && (
          <g className="mew-face">
            {/* Joyful arches for eyes */}
            <path
              d="M 36 63 Q 43 54 50 63"
              fill="none"
              stroke={colors.eye}
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <path
              d="M 70 63 Q 77 54 84 63"
              fill="none"
              stroke={colors.eye}
              strokeWidth="3.2"
              strokeLinecap="round"
            />

            {/* Happy open mouth */}
            <path
              d="M 51 68 Q 60 79 69 68 Z"
              fill="#ff5470"
              stroke={colors.eye}
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            {/* Tongue */}
            <path d="M 54 73 Q 60 72 66 73 Q 60 78 54 73" fill="#ff9ebb" />
          </g>
        )}

        {mood === 'proud' && (
          <g className="mew-face">
            {/* Confident happy sparkles eyes */}
            <path
              d="M 37 61 Q 43 56 49 61"
              fill="none"
              stroke={colors.eye}
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M 71 61 Q 77 56 83 61"
              fill="none"
              stroke={colors.eye}
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Smug smile */}
            <path
              d="M 51 68 Q 60 76 69 68"
              fill="none"
              stroke={colors.eye}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Little star sparkle above head */}
            <path
              d="M 60 16 L 62 22 L 68 24 L 62 26 L 60 32 L 58 26 L 52 24 L 58 22 Z"
              fill="#ffd166"
              stroke="#e0a000"
              strokeWidth="1"
            />
          </g>
        )}

        {mood === 'studying' && (
          <g className="mew-face">
            {/* Focused big eyes with glasses */}
            <circle cx="43" cy="62" r="11" fill="none" stroke="#3a255c" strokeWidth="2" />
            <circle cx="77" cy="62" r="11" fill="none" stroke="#3a255c" strokeWidth="2" />
            <line x1="54" y1="62" x2="66" y2="62" stroke="#3a255c" strokeWidth="2.2" />

            <ellipse cx="43" cy="62" rx="4.5" ry="6" fill={colors.eye} />
            <ellipse cx="77" cy="62" rx="4.5" ry="6" fill={colors.eye} />
            <circle cx="42" cy="59" r="2" fill="#ffffff" />
            <circle cx="76" cy="59" r="2" fill="#ffffff" />

            {/* Determined mouth */}
            <path d="M 54 71 L 66 71" stroke={colors.eye} strokeWidth="2.2" strokeLinecap="round" />
          </g>
        )}

        {mood === 'judgy' && (
          <g className="mew-face">
            {/* Side glance judgy eyes */}
            <ellipse cx="43" cy="63" rx="5.5" ry="6" fill={colors.eye} />
            <ellipse cx="77" cy="63" rx="5.5" ry="6" fill={colors.eye} />
            <circle cx="40" cy="61" r="1.8" fill="#ffffff" />
            <circle cx="74" cy="61" r="1.8" fill="#ffffff" />

            {/* Raised eyebrow */}
            <path d="M 36 53 Q 44 50 50 55" fill="none" stroke={colors.eye} strokeWidth="2.2" strokeLinecap="round" />
            <path d="M 70 55 Q 76 50 84 53" fill="none" stroke={colors.eye} strokeWidth="2.2" strokeLinecap="round" />

            {/* Flat line mouth */}
            <path d="M 53 72 Q 60 70 67 72" fill="none" stroke={colors.eye} strokeWidth="2.2" strokeLinecap="round" />
          </g>
        )}

        {mood === 'sleepy' && (
          <g className="mew-face">
            {/* Closed sleeping eyes */}
            <path d="M 37 63 Q 43 68 49 63" fill="none" stroke={colors.eye} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 71 63 Q 77 68 83 63" fill="none" stroke={colors.eye} strokeWidth="2.5" strokeLinecap="round" />

            {/* Small quiet o-mouth */}
            <ellipse cx="60" cy="72" rx="2.5" ry="3.5" fill={colors.eye} />

            {/* Animated Zzz floating */}
            <text x="88" y="42" fill="#6d53a4" fontSize="13" fontWeight="900" opacity="0.85" className="mew-zzz-1">
              Z
            </text>
            <text x="96" y="28" fill="#6d53a4" fontSize="10" fontWeight="900" opacity="0.65" className="mew-zzz-2">
              z
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
