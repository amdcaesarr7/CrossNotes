/**
 * Minimal, dependency-free confetti burst.
 *
 * Draws onto a temporary full-viewport canvas layered on top of everything,
 * then removes itself. No npm package, so nothing to fail to install or
 * version-mismatch — and it respects prefers-reduced-motion.
 */

interface ConfettiOptions {
  count?: number;
  colors?: string[];
  durationMs?: number;
}

const DEFAULT_COLORS = ["#f9a8d4", "#93c5fd", "#fdba74", "#86efac", "#c4b5fd", "#fde68a"];

export function fireConfetti(opts: ConfettiOptions = {}) {
  try {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const count = opts.count ?? 120;
    const duration = opts.durationMs ?? 2200;
    const colors = opts.colors ?? DEFAULT_COLORS;

    const canvas = document.createElement("canvas");
    canvas.style.position = "fixed";
    canvas.style.inset = "0";
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "9999";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);

    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) {
      canvas.remove();
      return;
    }

    const pieces = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height * 0.3,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      rot: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.3,
      vx: (Math.random() - 0.5) * 3,
      vy: 2 + Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

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
      ctx2d!.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of pieces) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04;
        p.rot += p.vRot;
        ctx2d!.save();
        ctx2d!.translate(p.x, p.y);
        ctx2d!.rotate(p.rot);
        ctx2d!.fillStyle = p.color;
        ctx2d!.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx2d!.restore();
      }
      if (elapsed < duration) {
        raf = requestAnimationFrame(frame);
      } else {
        cleanup();
      }
    }
    raf = requestAnimationFrame(frame);

    // Safety net: guarantees cleanup even if the tab is backgrounded mid-animation.
    setTimeout(cleanup, duration + 1500);
  } catch {
    // confetti is decorative only — never let it break the app
  }
}
