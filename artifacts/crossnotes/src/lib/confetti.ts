/**
 * High-performance, dependency-free celebration particle & confetti engine.
 *
 * Spawns dynamic celebration bursts with multi-shape physics:
 * - 3D tumbling ribbon strips with realistic tilt/flip perspective
 * - Twinkling 5-point stars with shimmer oscillation
 * - Playful clay circle pellets and diamonds
 * - Dual cannon / radial physics with drag, gravity, and air flutter
 *
 * Zero external packages, respects prefers-reduced-motion, and cleanly cleans up.
 */

interface ConfettiOptions {
  count?: number;
  colors?: string[];
  durationMs?: number;
  origin?: { x?: number; y?: number };
}

type ParticleShape = 'ribbon' | 'star' | 'circle' | 'diamond';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  color: string;
  shape: ParticleShape;
  rotation: number;
  vRot: number;
  tiltAngle: number;
  vTilt: number;
  wobble: number;
  wobbleSpeed: number;
  alpha: number;
  shimmerSpeed: number;
  shimmerPhase: number;
}

const DEFAULT_COLORS = [
  '#f43f5e', // Rose
  '#fb7185', // Rose light
  '#fb923c', // Tangerine
  '#facc15', // Amber gold
  '#4ade80', // Mint green
  '#38bdf8', // Sky blue
  '#818cf8', // Indigo
  '#c084fc', // Lilac violet
  '#f472b6', // Cotton candy
  '#ffd166', // Sunlight
];

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerR: number, innerR: number) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerR);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerR;
    y = cy + Math.sin(rot) * outerR;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerR;
    y = cy + Math.sin(rot) * innerR;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerR);
  ctx.closePath();
  ctx.fill();
}

export function fireConfetti(opts: ConfettiOptions = {}) {
  try {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const count = opts.count ?? 140;
    const duration = opts.durationMs ?? 2800;
    const colors = opts.colors ?? DEFAULT_COLORS;

    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.inset = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);

    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) {
      canvas.remove();
      return;
    }

    const shapes: ParticleShape[] = ['ribbon', 'ribbon', 'star', 'circle', 'diamond'];

    // Spawn from bottom corners (left cannon and right cannon)
    const particles: Particle[] = Array.from({ length: count }, (_, i) => {
      const isLeft = i % 2 === 0;
      const originX = opts.origin?.x !== undefined
        ? opts.origin.x * canvas.width
        : (isLeft ? canvas.width * 0.12 : canvas.width * 0.88);
      const originY = opts.origin?.y !== undefined
        ? opts.origin.y * canvas.height
        : canvas.height * 0.92;

      // Shoot upward and slightly inward
      const angle = isLeft
        ? (-(Math.PI / 4) - (Math.random() * 0.35))
        : (-(Math.PI * 3 / 4) + (Math.random() * 0.35));
      const speed = 11 + Math.random() * 13;

      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      const baseSize = shape === 'ribbon' ? 7 + Math.random() * 6 : 5 + Math.random() * 7;

      return {
        x: originX + (Math.random() - 0.5) * 40,
        y: originY + (Math.random() - 0.5) * 30,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 4,
        vy: Math.sin(angle) * speed - Math.random() * 4,
        w: baseSize,
        h: shape === 'ribbon' ? baseSize * (1.6 + Math.random() * 0.8) : baseSize,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.22,
        tiltAngle: Math.random() * Math.PI * 2,
        vTilt: 0.08 + Math.random() * 0.12,
        wobble: Math.random() * 10,
        wobbleSpeed: 0.06 + Math.random() * 0.08,
        alpha: 1,
        shimmerSpeed: 0.12 + Math.random() * 0.15,
        shimmerPhase: Math.random() * Math.PI * 2,
      };
    });

    const start = performance.now();
    let raf = 0;
    let cleaned = false;

    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      cancelAnimationFrame(raf);
      canvas.remove();
    };

    function frame(now: number) {
      const elapsed = now - start;
      const progress = elapsed / duration;

      ctx2d!.clearRect(0, 0, canvas.width, canvas.height);

      let aliveCount = 0;

      for (const p of particles) {
        // Physics update
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.vy += 0.32;

        p.wobble += p.wobbleSpeed;
        p.x += p.vx + Math.sin(p.wobble) * 1.2;
        p.y += p.vy;

        p.rotation += p.vRot;
        p.tiltAngle += p.vTilt;

        if (progress > 0.6) {
          p.alpha = Math.max(0, 1 - (progress - 0.6) / 0.4);
        }

        if (p.alpha <= 0 || p.y > canvas.height + 40) {
          continue;
        }
        aliveCount++;

        ctx2d!.save();
        ctx2d!.translate(p.x, p.y);
        ctx2d!.rotate(p.rotation);

        const tiltScale = Math.cos(p.tiltAngle);
        ctx2d!.scale(1, tiltScale);

        let currentAlpha = p.alpha;
        if (p.shape === 'star' || p.shape === 'diamond') {
          const shimmer = Math.sin(now * 0.008 * p.shimmerSpeed + p.shimmerPhase);
          currentAlpha = Math.max(0.2, Math.min(1, p.alpha * (0.8 + shimmer * 0.25)));
        }
        ctx2d!.globalAlpha = currentAlpha;
        ctx2d!.fillStyle = p.color;

        if (p.shape === 'ribbon') {
          ctx2d!.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        } else if (p.shape === 'star') {
          drawStar(ctx2d!, 0, 0, 5, p.w * 0.9, p.w * 0.45);
        } else if (p.shape === 'circle') {
          ctx2d!.beginPath();
          ctx2d!.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx2d!.fill();
        } else if (p.shape === 'diamond') {
          ctx2d!.beginPath();
          ctx2d!.moveTo(0, -p.h / 2);
          ctx2d!.lineTo(p.w / 2, 0);
          ctx2d!.lineTo(0, p.h / 2);
          ctx2d!.lineTo(-p.w / 2, 0);
          ctx2d!.closePath();
          ctx2d!.fill();
        }

        ctx2d!.restore();
      }

      if (elapsed < duration && aliveCount > 0) {
        raf = requestAnimationFrame(frame);
      } else {
        cleanup();
      }
    }

    raf = requestAnimationFrame(frame);

    setTimeout(cleanup, duration + 1000);
  } catch {
    // Decorative only
  }
}
