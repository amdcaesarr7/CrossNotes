import { useId } from 'react';

interface MewMascotProps {
  size?: 'sm' | 'md' | 'lg';
  mood?: 'cheery' | 'judgy' | 'sleepy';
  className?: string;
}

/** Warm-bear palette — cream face/body, cocoa ears + outline, rosy blush. */
const C = {
  faceTop: '#fbf1e4',
  faceBottom: '#e7cba6',
  belly: '#fff6ea',
  outline: '#8a5a3b',
  earTop: '#b07b52',
  earBottom: '#8a5a3b',
  innerEar: '#ecb79a',
  eye: '#3a281d',
  blush: '#f2a7a0',
  ink: '#7c4f31',
} as const;

/**
 * Mew, the CrossNotes study bear — a soft pear-bodied cloud creature drawn as
 * an inline SVG so it stays crisp at every size, theme-independent, and light
 * on the wire. The silhouette is the union of two circles (small head over a
 * larger body) for that gourd/pear shape; only the eyes and mouth swap per
 * `mood`, so the body, ears, arms, belly and feet stay put.
 */
export default function MewMascot({
  size = 'md',
  mood = 'cheery',
  className = '',
}: MewMascotProps) {
  // useId keeps gradient ids unique when several mascots share one page.
  const uid = useId().replace(/:/g, '');
  const faceGrad = `mew-face-${uid}`;
  const earGrad = `mew-ear-${uid}`;

  return (
    <span
      className={`mew-mascot mew-mascot--${size} mew-mascot--${mood} ${className}`}
      role="img"
      aria-label={`Mew looks ${mood}`}
    >
      <svg className="mew-mascot__svg" viewBox="0 0 100 122" aria-hidden="true">
        <defs>
          <linearGradient id={faceGrad} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={C.faceTop} />
            <stop offset="1" stopColor={C.faceBottom} />
          </linearGradient>
          <linearGradient id={earGrad} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={C.earTop} />
            <stop offset="1" stopColor={C.earBottom} />
          </linearGradient>
        </defs>

        {/* Stubby arms peeking from behind the body */}
        <g fill={`url(#${faceGrad})`} stroke={C.outline} strokeWidth="2.2" strokeLinejoin="round">
          <ellipse cx="17" cy="74" rx="6.5" ry="9" />
          <ellipse cx="83" cy="74" rx="6.5" ry="9" />
        </g>

        {/* Rounded ears, behind the head */}
        <g stroke={C.outline} strokeWidth="2.3">
          <circle cx="33" cy="17" r="10" fill={`url(#${earGrad})`} />
          <circle cx="67" cy="17" r="10" fill={`url(#${earGrad})`} />
        </g>
        <ellipse cx="33" cy="16" rx="4.2" ry="5" fill={C.innerEar} />
        <ellipse cx="67" cy="16" rx="4.2" ry="5" fill={C.innerEar} />

        {/* Pear body — head + body as one soft gourd silhouette */}
        <path
          d="M71 55.3 A26 26 0 1 0 29 55.3 A34 34 0 1 0 71 55.3 Z"
          fill={`url(#${faceGrad})`}
          stroke={C.outline}
          strokeWidth="2.4"
          strokeLinejoin="round"
        />

        {/* Soft belly */}
        <ellipse cx="50" cy="86" rx="20" ry="23" fill={C.belly} opacity="0.6" />

        {/* Little feet */}
        <g fill={`url(#${faceGrad})`} stroke={C.outline} strokeWidth="2.2" strokeLinejoin="round">
          <ellipse cx="40" cy="114" rx="8" ry="5.5" />
          <ellipse cx="60" cy="114" rx="8" ry="5.5" />
        </g>

        {/* Blush */}
        <ellipse cx="32" cy="49" rx="6.5" ry="3.8" fill={C.blush} opacity="0.72" />
        <ellipse cx="68" cy="49" rx="6.5" ry="3.8" fill={C.blush} opacity="0.72" />

        {/* Face — swaps with mood */}
        {mood === 'cheery' && (
          <g>
            <ellipse cx="39" cy="42" rx="6" ry="7.8" fill={C.eye} />
            <ellipse cx="61" cy="42" rx="6" ry="7.8" fill={C.eye} />
            <circle cx="36.8" cy="38.6" r="2" fill="#fff" />
            <circle cx="58.8" cy="38.6" r="2" fill="#fff" />
            <ellipse cx="50" cy="48.5" rx="2.2" ry="1.6" fill={C.ink} />
            <path
              d="M43 51 Q46.5 55.4 50 51 Q53.5 55.4 57 51"
              fill="none"
              stroke={C.ink}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        )}

        {mood === 'judgy' && (
          <g>
            <ellipse cx="39" cy="44" rx="5.4" ry="5.8" fill={C.eye} />
            <ellipse cx="61" cy="44" rx="5.4" ry="5.8" fill={C.eye} />
            <circle cx="41" cy="42" r="1.6" fill="#fff" />
            <circle cx="63" cy="42" r="1.6" fill="#fff" />
            <g stroke={C.ink} strokeWidth="2.3" strokeLinecap="round">
              <path d="M31 38 L46 41" fill="none" />
              <path d="M69 38 L54 41" fill="none" />
            </g>
            <ellipse cx="50" cy="50.5" rx="2.1" ry="1.5" fill={C.ink} />
            <path
              d="M44.5 54.5 Q50 56 55.5 54.5"
              fill="none"
              stroke={C.ink}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        )}

        {mood === 'sleepy' && (
          <g>
            <g stroke={C.eye} strokeWidth="2.1" strokeLinecap="round" fill="none">
              <path d="M31.5 43 Q38 38.5 44.5 43" />
              <path d="M55.5 43 Q62 38.5 68.5 43" />
            </g>
            <ellipse cx="50" cy="49" rx="2" ry="1.5" fill={C.ink} />
            <path
              d="M46 52 Q50 55 54 52"
              fill="none"
              stroke={C.ink}
              strokeWidth="1.9"
              strokeLinecap="round"
            />
            <text
              x="82"
              y="24"
              fontSize="11"
              fontWeight="800"
              fill={C.ink}
              opacity="0.7"
              style={{ fontFamily: 'inherit' }}
            >
              z
            </text>
          </g>
        )}
      </svg>
    </span>
  );
}
