import { useEffect, useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { useLocation } from 'wouter';
import { useMewPresence } from '@/hooks/useMewPresence';
import type { MewNudgeReason } from '@/lib/notifications';
import MewMascot from '@/components/MewMascot';
import { useTheme } from '@/contexts/ThemeContext';

interface MewPrompt {
  reason: MewNudgeReason;
  title: string;
  body: string;
}

const COPY: Record<MewNudgeReason, MewPrompt> = {
  'social-detour': {
    reason: 'social-detour',
    title: 'Back already? Mew definitely did not see a scroll detour.',
    body: 'CrossNotes only knows this tab went quiet—not where you went. Your notes, however, stayed loyal.',
  },
  'long-absence': {
    reason: 'long-absence',
    title: 'Well, look who remembered their notes exist.',
    body: 'No dramatic comeback required. Pick one tiny chapter and let Mew pretend this was the plan all along.',
  },
};

export default function MewCompanion() {
  const { isDark } = useTheme();
  const [, navigate] = useLocation();
  const [prompt, setPrompt] = useState<MewPrompt | null>(null);

  useMewPresence({ onNudge: (reason) => setPrompt(COPY[reason]) });

  useEffect(() => {
    if (!prompt) return;
    const timeout = window.setTimeout(() => setPrompt(null), 14_000);
    return () => window.clearTimeout(timeout);
  }, [prompt]);

  if (!prompt) return null;

  const goToSubjects = () => {
    setPrompt(null);
    navigate('/subjects');
  };

  return (
    <aside className={`mew-nudge ${isDark ? 'mew-theme-dark' : ''}`} role="status" aria-live="polite" aria-atomic="true">
      <div className="mew-nudge__mascot" aria-hidden="true">
        <MewMascot size="md" mood={prompt.reason === 'long-absence' ? 'sleepy' : 'judgy'} />
      </div>
      <div className="mew-nudge__copy">
        <span className="mew-nudge__eyebrow">Mew has an observation</span>
        <strong>{prompt.title}</strong>
        <p>{prompt.body}</p>
        <div className="mew-nudge__actions">
          <button className="mew-nudge__start" onClick={goToSubjects}>
            Pick a subject <ArrowRight size={14} />
          </button>
          <button className="mew-nudge__later" onClick={() => setPrompt(null)}>Not now</button>
        </div>
      </div>
      <button className="mew-nudge__close" onClick={() => setPrompt(null)} aria-label="Dismiss Mew's reminder"><X size={15} /></button>
    </aside>
  );
}
