import { useTheme } from '@/contexts/ThemeContext';
import { Variants, TargetAndTransition } from 'framer-motion';

/**
 * Hook to wrap animation variants with prefers-reduced-motion support.
 * If user prefers reduced motion, animations are disabled (instant transitions).
 */
export function useMotion() {
  const { prefersReducedMotion } = useTheme();

  const getVariants = (variants: Variants): Variants => {
    if (!prefersReducedMotion) return variants;

    // Return instant variants without motion
    return {
      initial: variants.initial,
      animate: variants.animate,
      exit: variants.exit,
      transition: { duration: 0 },
    };
  };

  const getTransition = (transition: any) => {
    if (!prefersReducedMotion) return transition;
    return { duration: 0 };
  };

  return { prefersReducedMotion, getVariants, getTransition };
}
