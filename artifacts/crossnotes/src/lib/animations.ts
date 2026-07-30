import { Variants } from 'framer-motion';

// Clay spring easing: cubic-bezier(0.34, 1.56, 0.64, 1)
// Used across the app for scale bounces and pops that feel tactile and stamped

export const claySpringConfig = {
  type: 'spring' as const,
  damping: 18,
  mass: 0.8,
  stiffness: 150,
};

// Smooth ease-out for slides and fades
export const easeOutConfig = {
  type: 'tween' as const,
  duration: 0.35,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

// Shared animation variants following the clay-spring vocabulary

export const clayVariants: Record<string, Variants> = {
  // Scale bounce — the app's signature pop
  pop: {
    initial: { scale: 0.92, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.8, opacity: 0 },
    transition: { ...claySpringConfig, duration: 0.35 },
  },

  // Vertical slide up — questions, cards, sections entering
  slideUp: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8, scale: 0.96 },
    transition: { duration: 0.28, ease: 'easeOut' },
  },

  // Horizontal slide from left — leaderboard rows, revision cards
  slideInFromLeft: {
    initial: { opacity: 0, x: -12 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -8 },
    transition: { duration: 0.3, ease: 'easeOut' },
  },

  // Fade only — subtle appearing without motion
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.25, ease: 'easeOut' },
  },

  // Scale in from center — cards and containers
  scaleIn: {
    initial: { opacity: 0, scale: 0.88 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.85 },
    transition: { duration: 0.35, ease: 'easeOut' },
  },

  // Stamp landing — results screens, verdicts (large scale pop with anticipation)
  stampLand: {
    initial: { scale: 0.6, opacity: 0, y: 20 },
    animate: { scale: 1, opacity: 1, y: 0 },
    exit: { scale: 0.8, opacity: 0, y: 10 },
    transition: { ...claySpringConfig, duration: 0.5, damping: 15 },
  },

  // Deck flip entrance — questions entering the flow
  deckFlipIn: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8, scale: 0.96 },
    transition: { duration: 0.28, ease: 'easeOut' },
  },
};

// Stagger container helper
export const staggerContainer = (
  delayBase: number = 0,
  delayIncrement: number = 0.08,
  duration: number = 0.35
) => ({
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: delayIncrement,
        delayChildren: delayBase,
      },
    },
  },
  item: {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration, ease: 'easeOut' },
    },
  },
});

// Stagger variant with custom initial/animate states
export const createStaggerVariant = (
  initialState: Record<string, any>,
  animateState: Record<string, any>,
  index: number,
  delayBase: number = 0,
  delayIncrement: number = 0.08,
  duration: number = 0.35
): Variants => ({
  initial: initialState,
  animate: {
    ...animateState,
    transition: {
      duration,
      ease: 'easeOut',
      delay: delayBase + index * delayIncrement,
    },
  },
  exit: { opacity: 0, ...Object.fromEntries(Object.keys(animateState).map(k => [k, initialState[k]])) },
});

// Spring bounce for coins, streaks, XP pours
export const springBounce = (scale: number = 1.15, duration: number = 0.4) => ({
  animate: { scale: [1, scale, 1] },
  transition: { ...claySpringConfig, duration },
});

// Pulse animation for highlighting (streaks at 7+, in-progress indicators)
export const pulseVariant: Variants = {
  animate: {
    scale: [1, 1.08, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Glow pulse for streak milestones and achievements
export const glowPulse: Variants = {
  animate: {
    scale: [0.9, 1.15, 1],
    boxShadow: [
      '0 0 0px rgba(249, 115, 22, 0)',
      '0 0 20px rgba(249, 115, 22, 0.6)',
      '0 0 0px rgba(249, 115, 22, 0)',
    ],
  },
  transition: { duration: 0.6, ...claySpringConfig },
};

// Rotate spin for medal icons, crown
export const spinOnce: Variants = {
  animate: { rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] },
  transition: { duration: 0.5, ease: 'easeInOut' },
};

// Shake animation for wrong answers
export const shake: Variants = {
  animate: { x: [-3, 3, -3, 0] },
  transition: { duration: 0.4, ease: 'easeInOut' },
};

// Glee rotation for quiz dot pop
export const gleeRotate: Variants = {
  animate: { rotate: [0, 4, -4, 0], scale: [1, 1.12, 1] },
  transition: { duration: 0.35, ...claySpringConfig },
};

// Checkmark spin for answer reveal
export const checkmarkSpin: Variants = {
  initial: { scale: 0, rotate: -180 },
  animate: { scale: 1, rotate: 0 },
  transition: { duration: 0.3, ...claySpringConfig },
};
