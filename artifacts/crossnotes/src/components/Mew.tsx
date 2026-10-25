import React, { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";

export type MituMood = "idle" | "happy" | "sad" | "thinking" | "celebrate";
export type MewMood = MituMood;

export interface MituProps {
  mood?: MituMood;
  /** Width in px. Height follows the artboard ratio. */
  size?: number;
  className?: string;
  /** Clicking Mew gives her a little boop. */
  onClick?: () => void;
}
export type MewProps = MituProps;

/* ---------- palette (flat fills only, no gradients) ---------- */
const C = {
  base: "#FFEFE3",
  shade: "#F0CFC6",
  ink: "#5B3B4D",
  blush: "#FFA9A6",
  petal: "#FFFFFF",
  petalShade: "#DCCFEA",
  gold: "#FFCB4C",
  goldShade: "#E8A12E",
  goldHi: "#FFE6A0",
  tongue: "#FF8FA0",
  dot: "#CDBFEA",
  ground: "#3A2D5C",
};

/* ---------- geometry: one silhouette, split into rig pieces ----------
   Torso covers the head and belly. Wings and feet sit behind it and
   share its fills, so at rest the five pieces read as one shape. */
const TORSO =
  "M180 84 C124 84 100 130 98 194 C97.5 211 94.5 226.5 91.4 241.8 C100 256 116 280 128 294 C145 304 172 310 190 308 C208 310 235 304 252 294 C264 280 280 256 288.6 241.8 C285.5 226.5 282.5 211 282 194 C280 130 240 84 180 84 Z";
const WING_L =
  "M94.9 223.3 C91.2 245.2 85.4 265.6 84 288 C83 311 93 322 105 320 C118 318 124 304 128 294 L127 262 L112 232 Z";
const WING_R =
  "M285.1 223.3 C288.8 245.2 294.6 265.6 296 288 C297 311 287 322 275 320 C262 318 256 304 252 294 L253 262 L268 232 Z";
const FOOT_L =
  "M128 294 C127 316 127 334 138 343 C150 351 172 351 182 344 C190 338 190 322 190 308 L190 282 L124 282 Z";
const FOOT_R =
  "M252 294 C253 316 253 334 242 343 C230 351 208 351 198 344 C190 338 190 322 190 308 L190 282 L256 282 Z";

/* Joint pivots */
const SHOULDER_L: [number, number] = [106, 240];
const SHOULDER_R: [number, number] = [274, 240];
const HIP_L: [number, number] = [158, 292];
const HIP_R: [number, number] = [222, 292];
const FLOWER_BASE: [number, number] = [142, 112];

/* ---------- moods ---------- */
interface Pose {
  tilt: number; // deg, + leans right
  low: number; // px the torso sinks onto the legs
  squash: number; // sustained squash, 0..0.2
  wingL: number; // rest angle, deg outward
  wingR: number;
  flap: number; // flap amplitude, deg
  flapHz: number;
  hop: number; // 0..1 hop height
  period: number; // seconds per hop
  flower: number; // extra flower droop, deg
  gazeX: number;
  gazeY: number;
  lid: number; // 0 open .. 0.4 droopy
  blush: number;
  smile: number; // open mouth scale
  breath: number; // seconds per breath
  breathAmp: number;
  eHappy: number;
  eOpen: number;
  brows: number;
  mW: number;
  mOpen: number;
  mFrown: number;
  mO: number;
  dots: number;
}
type PoseKey = keyof Pose;

const FACE_OFF = { eHappy: 0, eOpen: 0, brows: 0, mW: 0, mOpen: 0, mFrown: 0, mO: 0, dots: 0 };

const POSES: Record<MituMood, Pose> = {
  idle: {
    tilt: 0, low: 0, squash: 0, wingL: 5, wingR: 5, flap: 2.5, flapHz: 0.4,
    hop: 0, period: 1, flower: 0, gazeX: 0, gazeY: 0, lid: 0, blush: 0.65,
    smile: 0, breath: 3.4, breathAmp: 1,
    ...FACE_OFF, eHappy: 1, mW: 1,
  },
  happy: {
    tilt: -1.5, low: 0, squash: 0, wingL: 16, wingR: 16, flap: 9, flapHz: 1.7,
    hop: 0.34, period: 1.05, flower: 0, gazeX: 0, gazeY: 0, lid: 0, blush: 0.9,
    smile: 0.7, breath: 2.2, breathAmp: 1.4,
    ...FACE_OFF, eHappy: 1, mOpen: 1,
  },
  sad: {
    tilt: -5, low: 5, squash: 0.05, wingL: -3, wingR: -3, flap: 1.2, flapHz: 0.25,
    hop: 0, period: 1, flower: 18, gazeX: 0, gazeY: 3, lid: 0.25, blush: 0.3,
    smile: 0, breath: 4.6, breathAmp: 1.7,
    ...FACE_OFF, eOpen: 1, brows: 1, mFrown: 1,
  },
  thinking: {
    tilt: 6, low: 0, squash: 0, wingL: 4, wingR: 38, flap: 2, flapHz: 0.5,
    hop: 0, period: 1, flower: 4, gazeX: 5, gazeY: -4, lid: 0, blush: 0.6,
    smile: 0, breath: 3.6, breathAmp: 1,
    ...FACE_OFF, eOpen: 1, mO: 1, dots: 1,
  },
  celebrate: {
    tilt: 0, low: 0, squash: 0, wingL: 50, wingR: 50, flap: 22, flapHz: 2.1,
    hop: 1, period: 0.95, flower: 0, gazeX: 0, gazeY: 0, lid: 0, blush: 1,
    smile: 1, breath: 1.4, breathAmp: 1.5,
    ...FACE_OFF, eHappy: 1, mOpen: 1,
  },
};

const KEYS = Object.keys(POSES.idle) as PoseKey[];
const FADE_KEYS = new Set<PoseKey>(["eHappy", "eOpen", "brows", "mW", "mOpen", "mFrown", "mO", "dots"]);

/* ---------- little physics helpers ---------- */
interface Spring {
  x: number;
  v: number;
}
const step = (s: Spring, target: number, k: number, zeta: number, dt: number) => {
  const c = 2 * zeta * Math.sqrt(k);
  s.v += (k * (target - s.x) - c * s.v) * dt;
  s.x += s.v * dt;
};
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));
const f = (n: number) => n.toFixed(2);

/* One hop: crouch, launch (stretch), parabola in the air, land (squash). */
const hopShape = (ph: number): { h: number; q: number } => {
  if (ph < 0.18) return { h: 0, q: 0.14 * (ph / 0.18) };
  if (ph < 0.8) {
    const u = (ph - 0.18) / 0.62;
    const h = 4 * u * (1 - u);
    return { h, q: -0.08 * (1 - h) };
  }
  const v = (ph - 0.8) / 0.2;
  return { h: 0, q: 0.16 * (1 - v) * (1 - v) };
};

/* ---------- drawing ---------- */
const PETALS = [0, 60, 120, 180, 240, 300].map((a) => (
  <ellipse key={a} cx={0} cy={-12} rx={7.5} ry={11} transform={`rotate(${a})`} />
));

/* Flat "3D": a darker full shape with a lighter copy shifted up-left on top,
   clipped to the piece, leaves a crescent of shade on the lower-right edge. */
function Piece(props: { id: string; d: string; shift: [number, number]; cover?: ReactNode; children?: ReactNode }) {
  const { id, d, shift, cover, children } = props;
  return (
    <>
      <clipPath id={id}>
        <path d={d} />
      </clipPath>
      <path d={d} fill={C.shade} />
      <g clipPath={`url(#${id})`}>
        <path d={d} fill={C.base} transform={`translate(${shift[0]} ${shift[1]})`} />
        {cover}
      </g>
      {children}
    </>
  );
}

export default function Mew({ mood = "idle", size = 280, className, onClick }: MituProps) {
  const uid = useId().replace(/:/g, "");
  const parts = useRef<Record<string, SVGElement | null>>({});
  const reg = (k: string) => (el: SVGElement | null) => {
    parts.current[k] = el;
  };
  const moodRef = useRef<MituMood>(mood);
  moodRef.current = mood;
  const pokeRef = useRef<() => void>(() => {});
  const init = useRef(POSES[mood]).current;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");

    // Pause animation loop when tab is hidden (performance optimization)
    let isVisible = !document.hidden;
    const handleVisibility = () => { isVisible = !document.hidden; };
    document.addEventListener('visibilitychange', handleVisibility);

    const start = POSES[moodRef.current];
    const P = Object.fromEntries(KEYS.map((k) => [k, { x: start[k], v: 0 }])) as Record<PoseKey, Spring>;
    const sq: Spring = { x: 0, v: 0 };
    const wl: Spring = { x: start.wingL, v: 0 };
    const wr: Spring = { x: start.wingR, v: 0 };
    const fl: Spring = { x: start.flower, v: 0 };

    let last = performance.now();
    let t = 0;
    let raf = 0;
    let hopPh = 0, flapPh = 0, breathPh = 0, swayPh = 0;
    let blinkT0 = -10, nextBlink = 1.5, nextFlick = 3;

    pokeRef.current = () => {
      sq.v += 6;
      wl.v += 120;
      wr.v += 120;
    };

    const frame = (now: number) => {
      if (!isVisible) {
        last = now;
        raf = requestAnimationFrame(frame);
        return;
      }
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      t += dt;
      const reduce = mq.matches;
      const tgt = POSES[moodRef.current];

      for (const k of KEYS) {
        const fade = FADE_KEYS.has(k);
        step(P[k], tgt[k], fade ? 420 : 80, fade ? 1 : 0.85, dt);
      }

      /* hop */
      const A = reduce ? 0 : clamp(P.hop.x, 0, 1.2);
      const gate = clamp(A / 0.15, 0, 1);
      if (A < 0.02) hopPh = 0;
      else hopPh = (hopPh + dt / Math.max(0.4, P.period.x)) % 1;
      const hs = hopShape(hopPh);
      step(sq, hs.q * gate * (0.5 + 0.5 * Math.min(A, 1)), 260, 0.55, dt);
      const lift = -34 * A * hs.h;
      const qTot = sq.x + P.squash.x;

      /* idle life: breathing, weight shift, wing flicks, blinking */
      breathPh += (dt * 2 * Math.PI) / Math.max(1, P.breath.x);
      swayPh += (dt * 2 * Math.PI) / 7;
      const b = reduce ? 0 : Math.sin(breathPh);
      const sway = reduce ? 0 : Math.sin(swayPh) * (1 - gate);
      if (!reduce && t > nextFlick) {
        (Math.random() < 0.5 ? wl : wr).v += 70;
        nextFlick = t + 3 + Math.random() * 4.5;
      }
      if (!reduce && t > nextBlink) {
        blinkT0 = t;
        nextBlink = t + 2.2 + Math.random() * 3.3;
      }
      const bp = (t - blinkT0) / 0.15;
      const blink = bp >= 0 && bp <= 1 ? Math.sin(Math.PI * bp) : 0;

      /* wings: spring toward target, so they lag the body and settle with a wobble */
      flapPh += dt * 2 * Math.PI * P.flapHz.x;
      const synced = Math.sin(2 * Math.PI * (hopPh + 0.07));
      const fvL = reduce ? 0 : Math.sin(flapPh) * (1 - gate) + synced * gate;
      const fvR = reduce ? 0 : Math.sin(flapPh + 0.5) * (1 - gate) + synced * gate;
      step(wl, P.wingL.x + P.flap.x * fvL, 150, 0.42, dt);
      step(wr, P.wingR.x + P.flap.x * fvR, 150, 0.42, dt);

      /* torso lean */
      const tilt = P.tilt.x + sway * 1.1;

      /* flower trails the head */
      const flT = P.flower.x - 0.9 * tilt + (reduce ? 0 : 2.5 * Math.sin((2 * Math.PI * t) / 2.6)) - 4 * sq.v;
      step(fl, flT, 70, 0.28, dt);

      /* write to the DOM */
      const g = parts.current;
      const set = (k: string, attr: string, v: string) => g[k]?.setAttribute(attr, v);

      set("root", "transform", `translate(0 ${f(lift)}) translate(190 348) scale(${f(1 + 0.7 * qTot)} ${f(1 - qTot)}) translate(-190 -348)`);
      set("torso", "transform", `translate(${f(sway * 1.4)} ${f(P.low.x)}) rotate(${f(tilt)} 190 304) translate(190 346) scale(${f(1 - P.breathAmp.x * 0.006 * b)} ${f(1 + P.breathAmp.x * 0.012 * b)}) translate(-190 -346)`);
      set("wingL", "transform", `rotate(${f(wl.x)} ${SHOULDER_L[0]} ${SHOULDER_L[1]})`);
      set("wingR", "transform", `rotate(${f(-wr.x)} ${SHOULDER_R[0]} ${SHOULDER_R[1]})`);
      set("flower", "transform", `rotate(${f(fl.x)} ${FLOWER_BASE[0]} ${FLOWER_BASE[1]})`);

      const tuck = 6 * A * hs.h;
      const loadL = 1.8 * clamp((sway - 0.75) / 0.25, 0, 1);
      const loadR = 1.8 * clamp((-sway - 0.75) / 0.25, 0, 1);
      set("footL", "transform", `translate(0 ${f(-tuck - loadL)}) rotate(${f(-tuck)} ${HIP_L[0]} ${HIP_L[1]})`);
      set("footR", "transform", `translate(0 ${f(-tuck - loadR)}) rotate(${f(tuck)} ${HIP_R[0]} ${HIP_R[1]})`);

      set("eOpenT", "transform", `translate(${f(P.gazeX.x)} ${f(P.gazeY.x)}) translate(0 192) scale(1 ${f(Math.max(0.05, (1 - P.lid.x) * (1 - 0.9 * blink)))}) translate(0 -192)`);
      set("mOpenT", "transform", `translate(190 208) scale(${f(Math.max(0.2, P.smile.x))}) translate(-190 -208)`);

      for (const k of FADE_KEYS) set(k, "opacity", f(clamp(P[k].x, 0, 1)));
      set("blush", "opacity", f(clamp(P.blush.x, 0, 1)));

      set("shadow", "transform", `translate(190 350) scale(${f((1 + 0.5 * qTot) * (1 - 0.28 * A * hs.h))} 1) translate(-190 -350)`);
      set("shadow", "opacity", f(0.2 * (1 - 0.5 * A * hs.h)));

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const poke = () => {
    pokeRef.current();
    onClick?.();
  };

  return (
    <svg
      viewBox="30 10 320 360"
      width={size}
      height={(size * 360) / 320}
      role="img"
      aria-label={`Mew, feeling ${mood}`}
      className={className}
      onClick={poke}
      style={{ overflow: "visible", cursor: onClick ? "pointer" : undefined }}
    >
      <ellipse ref={reg("shadow")} data-part="shadow" cx={190} cy={350} rx={98} ry={10} fill={C.ground} opacity={0.2} />

      <g ref={reg("root")} data-part="root">
        <g ref={reg("footL")} data-part="footL">
          <Piece id={`${uid}-fl`} d={FOOT_L} shift={[-5, -9]}>
            <ellipse cx={148} cy={322} rx={9} ry={4} fill="#fff" opacity={0.55} transform="rotate(-15 148 322)" />
          </Piece>
        </g>
        <g ref={reg("footR")} data-part="footR">
          <Piece id={`${uid}-fr`} d={FOOT_R} shift={[-5, -9]}>
            <ellipse cx={206} cy={322} rx={9} ry={4} fill="#fff" opacity={0.55} transform="rotate(-15 206 322)" />
          </Piece>
        </g>

        <g ref={reg("torso")} data-part="torso">
          <g ref={reg("wingL")} data-part="wingL">
            <Piece id={`${uid}-wl`} d={WING_L} shift={[-4, -7]}>
              <ellipse cx={98} cy={278} rx={4} ry={8} fill="#fff" opacity={0.55} transform="rotate(8 98 278)" />
            </Piece>
          </g>
          <g ref={reg("wingR")} data-part="wingR">
            <Piece id={`${uid}-wr`} d={WING_R} shift={[-4, -7]}>
              <ellipse cx={268} cy={278} rx={4} ry={8} fill="#fff" opacity={0.55} transform="rotate(-8 268 278)" />
            </Piece>
          </g>

          <Piece id={`${uid}-tr`} d={TORSO} shift={[-6, -4]} cover={<path d="M91.4 241.8 C100 256 116 280 128 294 C119 276 103 252 91.4 241.8 Z" fill={C.shade} />}>
            <path d="M116 186 C114 168 117 156 124 146" fill="none" stroke="#fff" strokeWidth={8} strokeLinecap="round" opacity={0.75} />
          </Piece>

          <g transform="rotate(-5 190 205)" data-part="face">
            <g ref={reg("blush")} opacity={init.blush} fill={C.blush}>
              <ellipse cx={140} cy={214} rx={13} ry={8} />
              <ellipse cx={240} cy={214} rx={13} ry={8} />
            </g>

            <g ref={reg("eHappy")} opacity={init.eHappy} fill="none" stroke={C.ink} strokeWidth={5} strokeLinecap="round">
              <path d="M148 196 Q160 180 172 196" />
              <path d="M208 196 Q220 180 232 196" />
            </g>
            <g ref={reg("eOpen")} opacity={init.eOpen}>
              <g ref={reg("eOpenT")}>
                <ellipse cx={160} cy={192} rx={6.5} ry={8.5} fill={C.ink} />
                <ellipse cx={220} cy={192} rx={6.5} ry={8.5} fill={C.ink} />
                <circle cx={162.2} cy={189} r={2.2} fill="#fff" />
                <circle cx={222.2} cy={189} r={2.2} fill="#fff" />
              </g>
            </g>
            <g ref={reg("brows")} opacity={init.brows} fill="none" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round">
              <path d="M147 180 L170 172" />
              <path d="M210 172 L233 180" />
            </g>

            <g ref={reg("mW")} opacity={init.mW} fill="none" stroke={C.ink} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
              <path d="M180 212 Q185 221 190 213 Q195 221 200 212" />
            </g>
            <g ref={reg("mOpen")} opacity={init.mOpen}>
              <g ref={reg("mOpenT")}>
                <path d="M178 208 L202 208 Q202 228 190 228 Q178 228 178 208 Z" fill={C.ink} stroke={C.ink} strokeWidth={2} strokeLinejoin="round" />
                <ellipse cx={190} cy={223.5} rx={6} ry={3.8} fill={C.tongue} />
              </g>
            </g>
            <g ref={reg("mFrown")} opacity={init.mFrown} fill="none" stroke={C.ink} strokeWidth={4} strokeLinecap="round">
              <path d="M181 219 Q190 210 199 219" />
            </g>
            <g ref={reg("mO")} opacity={init.mO} fill={C.ink}>
              <ellipse cx={190} cy={214} rx={4.5} ry={5.5} />
            </g>
          </g>

          <g ref={reg("flower")} data-part="flower">
            <g transform="translate(142 106) rotate(12)">
              <g transform="translate(1.5 2.5)" fill={C.petalShade}>
                {PETALS}
              </g>
              <g fill={C.petal}>{PETALS}</g>
              <circle cx={0.8} cy={1.5} r={7.5} fill={C.goldShade} />
              <circle cx={0} cy={0} r={7} fill={C.gold} />
              <circle cx={-2} cy={-2.5} r={2} fill={C.goldHi} />
            </g>
          </g>
        </g>

        <g ref={reg("dots")} opacity={init.dots} fill={C.dot}>
          <circle cx={248} cy={78} r={4}>
            <animate attributeName="r" values="4;5.5;4" dur="1.4s" begin="0s" repeatCount="indefinite" />
          </circle>
          <circle cx={264} cy={60} r={6}>
            <animate attributeName="r" values="6;7.5;6" dur="1.4s" begin="0.25s" repeatCount="indefinite" />
          </circle>
          <circle cx={288} cy={36} r={9}>
            <animate attributeName="r" values="9;10.5;9" dur="1.4s" begin="0.5s" repeatCount="indefinite" />
          </circle>
        </g>
      </g>
    </svg>
  );
}
