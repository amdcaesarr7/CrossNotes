/** Claymorphic persistent navigation keeps primary study routes visible; Progress is accessed from the account menu. */
import { Home, BookOpen, Trophy, ShieldCheck } from 'lucide-react';
import { Link, useLocation } from 'wouter';

const TABS = [
  { path: '/',            label: 'Home',     Icon: Home       },
  { path: '/subjects',   label: 'Study',    Icon: BookOpen    },
  { path: '/vault',      label: 'Vault',    Icon: ShieldCheck },
  { path: '/leaderboard', label: 'Ranks',  Icon: Trophy      },
];

export default function BottomNav() {
  const [loc] = useLocation();

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {TABS.map(({ path, label, Icon }) => {
        const active = path === '/' ? loc === '/' : loc.startsWith(path);
        return (
          <Link
            key={path}
            href={path}
            className={`bottom-nav-tab${active ? ' active' : ''}`}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 1.8} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
