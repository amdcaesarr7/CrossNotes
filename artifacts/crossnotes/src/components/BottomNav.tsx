import { Home, BookOpen, BarChart2, Trophy, ShieldCheck } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { useMotion } from '@/hooks/useMotion';

const TABS = [
  { path: '/',            label: 'Home',     Icon: Home       },
  { path: '/subjects',   label: 'Study',    Icon: BookOpen    },
  { path: '/vault',      label: 'Vault',    Icon: ShieldCheck },
  { path: '/progress',  label: 'Progress', Icon: BarChart2   },
  { path: '/leaderboard', label: 'Ranks',  Icon: Trophy      },
];

export default function BottomNav() {
  const [loc] = useLocation();
  const { prefersReducedMotion } = useTheme();
  const { getVariants } = useMotion();

  return (
    <nav className="bottom-nav">
      {TABS.map(({ path, label, Icon }) => {
        const active = path === '/' ? loc === '/' : loc.startsWith(path);
        return (
          <Link key={path} href={path}>
            <motion.button
              className={`bottom-nav-tab${active ? ' active' : ''}`}
              whileTap={!prefersReducedMotion ? { scale: 0.85 } : {}}
              transition={!prefersReducedMotion ? { duration: 0.08 } : {}}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span>{label}</span>
            </motion.button>
          </Link>
        );
      })}
    </nav>
  );
}
