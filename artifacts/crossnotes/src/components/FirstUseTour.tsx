import { useEffect, useState } from 'react';
import { ArrowRight, Check, Compass, Sparkles, X } from 'lucide-react';
import MewMascot from '@/components/MewMascot';
import { useTheme } from '@/contexts/ThemeContext';

const TOUR_KEY = 'cn-first-use-tour-complete';

const steps = [
  {
    eyebrow: 'A proper hello',
    title: 'Meet Mew, your very opinionated study buddy.',
    copy: 'Mew will celebrate the wins, point you back to your streak, and gently judge suspiciously long detours.',
    icon: Sparkles,
  },
  {
    eyebrow: 'Your study loop',
    title: 'Pick a subject. Read, practice, and quiz.',
    copy: 'Subjects hold chapters; each chapter has notes, flashcards, and a quiz. Complete the loop to collect XP and keep your progress moving.',
    icon: Compass,
  },
  {
    eyebrow: 'Momentum matters',
    title: 'Small sessions are still real sessions.',
    copy: 'Use the dashboard to continue where you left off. Turn on reminders later if you want Mew to defend your streak from your future self.',
    icon: Check,
  },
] as const;

function markTourComplete() {
  try {
    localStorage.setItem(TOUR_KEY, 'true');
  } catch {
    // The tour still closes if storage is unavailable; it may reappear next visit.
  }
}

export default function FirstUseTour() {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const activeStep = steps[step];
  const StepIcon = activeStep.icon;

  useEffect(() => {
    try {
      setIsOpen(localStorage.getItem(TOUR_KEY) !== 'true');
    } catch {
      setIsOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeTour();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const closeTour = () => {
    markTourComplete();
    setIsOpen(false);
  };

  const goForward = () => {
    if (step === steps.length - 1) {
      closeTour();
      return;
    }
    setStep((current) => current + 1);
  };

  if (!isOpen) return null;

  return (
    <div className={`mew-tour-overlay ${isDark ? 'mew-theme-dark' : ''}`} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeTour()}>
      <section className="mew-tour-dialog" role="dialog" aria-modal="true" aria-labelledby="mew-tour-title" aria-describedby="mew-tour-copy">
        <button className="mew-tour-close" onClick={closeTour} aria-label="Skip the CrossNotes tour">
          <X size={18} />
        </button>

        <div className="mew-tour-visual" aria-hidden="true">
          <div className="mew-tour-orbit mew-tour-orbit--one" />
          <div className="mew-tour-orbit mew-tour-orbit--two" />
          <MewMascot size="lg" mood={step === 2 ? 'judgy' : 'cheery'} />
        </div>

        <div className="mew-tour-copy">
          <span className="mew-tour-eyebrow"><StepIcon size={14} /> {activeStep.eyebrow}</span>
          <h2 id="mew-tour-title">{activeStep.title}</h2>
          <p id="mew-tour-copy">{activeStep.copy}</p>
        </div>

        <div className="mew-tour-footer">
          <div className="mew-tour-progress" aria-label={`Step ${step + 1} of ${steps.length}`}>
            {steps.map((item, index) => <span key={item.eyebrow} className={index === step ? 'active' : index < step ? 'complete' : ''} />)}
          </div>
          <div className="mew-tour-actions">
            <button className="mew-tour-skip" onClick={closeTour}>Skip</button>
            <button className="clay-btn mew-tour-next" onClick={goForward}>
              {step === steps.length - 1 ? 'Let’s study' : 'Next'}
              {step === steps.length - 1 ? <Check size={16} /> : <ArrowRight size={16} />}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
