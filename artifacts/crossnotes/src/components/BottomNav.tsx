import { Home, BookOpen, BarChart2, Trophy, ShieldCheck } from 'lucide-react';
import { Link, useLocation } from 'wouter';

const TABS = [
  { path: '/',            label: 'Home',     Icon: Home       },
  { path: '/subjects',   label: 'Study',    Icon: BookOpen    },
  { path: '/vault',      label: 'Vault',    Icon: ShieldCheck },
  { path: '/progress',  label: 'Progress', Icon: BarChart2   },
  { path: '/leaderboard', label: 'Ranks',  Icon: Trophy      },
];

export default function BottomNav() {
  const [loc] = useLocation();

  return (
    <nav className="bottom-nav">
      {TABS.map(({ path, label, Icon }) => {
        const active = path === '/' ? loc === '/' : loc.startsWith(path);
        return (
          <Link key={path} href={path}>
            <button className={`bottom-nav-tab${active ? ' active' : ''}`}>
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span>{label}</span>
            </button>
          </Link>
        );
      })}
    </nav>
  );
}
