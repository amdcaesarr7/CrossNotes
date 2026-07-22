import { useState } from 'react';
import { ChevronRight, Lock } from 'lucide-react';
import { Link } from 'wouter';
import { useTheme } from '@/contexts/ThemeContext';
import { useStaticSubjects } from '@/hooks/useContent';
import AppHeader from '@/components/AppHeader';
import BottomNav from '@/components/BottomNav';
import '../crossnotes.css';

const LOCKED_EXCUSES = [
  "Caesar didn't upload this one yet 😅",
  "Our study elves are still typing 📝",
  "Coming soon™ (before boards, relax)",
  "Witness protection 🕵️‍♂️",
  "The pages are drying. Be patient.",
];

export default function Subjects() {
  const { isDark } = useTheme();
  const subjects = useStaticSubjects();
  const [excuseIdx, setExcuseIdx] = useState(0);

  const liveSubjects   = subjects.filter(s => s.isLive);
  const lockedSubjects = subjects.filter(s => !s.isLive);

  return (
    <div className={`cn-body ${isDark ? 'dark-mode' : ''}`}>
      <AppHeader title="Subjects" />

      <main className="page-content">
        {/* Live subjects */}
        <section>
          <h2 className="section-header mb-3">Available Now</h2>
          <div className="flex flex-col gap-3">
            {liveSubjects.map(s => (
              <Link key={s.id} href={`/subject/${s.slug}`}>
                <div
                  className="clay-card hoverable flex items-center gap-4 p-4 cursor-pointer"
                  style={{ background: `var(--${s.color}-bg)`, borderColor: `var(--${s.color}-border)` }}
                >
                  <span className="text-4xl">{s.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-base leading-tight" style={{ color: 'var(--text)' }}>{s.name}</h3>
                    {s.description && <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{s.description}</p>}
                  </div>
                  <ChevronRight size={20} style={{ color: `var(--${s.color}-shadow)`, flexShrink: 0 }} />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Locked subjects */}
        {lockedSubjects.length > 0 && (
          <section>
            <h2 className="section-header mb-3" style={{ color: 'var(--text-muted)' }}>Coming Soon</h2>
            <div className="flex flex-col gap-3">
              {lockedSubjects.map(s => (
                <button
                  key={s.id}
                  onClick={() => setExcuseIdx(i => (i + 1) % LOCKED_EXCUSES.length)}
                  className="w-full text-left clay-card flex items-center gap-4 p-4 opacity-55"
                  style={{ background: `var(--${s.color}-bg)`, borderColor: `var(--${s.color}-border)`, cursor: 'pointer' }}
                >
                  <span className="text-4xl grayscale">{s.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-base leading-tight" style={{ color: 'var(--text)' }}>{s.name}</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{LOCKED_EXCUSES[excuseIdx]}</p>
                  </div>
                  <Lock size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Tip */}
        <div className="clay-card p-4 flex items-start gap-3" style={{ background: 'var(--gold-light)', borderColor: 'var(--gold-border)' }}>
          <span className="text-xl">💡</span>
          <p className="text-sm font-semibold" style={{ color: '#92400e' }}>
            Tap a locked subject to see an excuse. More content is being added before your boards!
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
