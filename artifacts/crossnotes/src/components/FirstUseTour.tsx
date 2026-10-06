import { useEffect, useState } from 'react';
import { ArrowRight, Check, Compass, Download, MoreHorizontal, PlusSquare, Share2, Sparkles, X } from 'lucide-react';
import MewMascot from '@/components/MewMascot';
import { useTheme } from '@/contexts/ThemeContext';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { TOUR_COMPLETE_KEY } from '@/lib/installPrompt';
import { TOUR_STEPS, VOICE } from '@/lib/voice';

const stepIcons = [Download, Sparkles, Compass, Check] as const;

function markTourComplete() {
  try {
    localStorage.setItem(TOUR_COMPLETE_KEY, 'true');
  } catch {
    // Tour still closes if storage is unavailable; it may reappear next visit.
  }
}

export default function FirstUseTour() {
  const { isDark } = useTheme();
  const { installed, canInstall, install, ios } = useInstallPrompt();
  const [isOpen, setIsOpen] = useState(false);
  // Start on Mew intro if already installed — install step is optional, never blocking.
  const [step, setStep] = useState(installed ? 1 : 0);
  const activeStep = TOUR_STEPS[step];
  const StepIcon = stepIcons[step] ?? Sparkles;

  useEffect(() => {
    if (installed && step === 0) setStep(1);
  }, [installed, step]);

  useEffect(() => {
    try {
      setIsOpen(localStorage.getItem(TOUR_COMPLETE_KEY) !== 'true');
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
    if (step === TOUR_STEPS.length - 1) {
      closeTour();
      return;
    }
    setStep((current) => current + 1);
  };

  const handlePrimary = async () => {
    if (step === 0 && canInstall) {
      await install();
      // Always advance — studying is never blocked on install accept/dismiss.
      goForward();
      return;
    }
    goForward();
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
          <MewMascot size="lg" mood={step === 3 ? 'judgy' : 'cheery'} />
        </div>

        <div className="mew-tour-copy">
          <span className="mew-tour-eyebrow"><StepIcon size={14} /> {activeStep.eyebrow}</span>
          <h2 id="mew-tour-title">{activeStep.title}</h2>
          <p id="mew-tour-copy">{activeStep.copy}</p>

          {step === 0 && (
            <div className="mew-tour-install" aria-label="Install instructions">
              <div><MoreHorizontal size={17} /><span>{VOICE.installStep1}</span></div>
              <div>{ios ? <Share2 size={17} /> : <Download size={17} />}<span>{ios ? VOICE.installStep2Ios : VOICE.installStep2Other}</span></div>
              <div><PlusSquare size={17} /><span>{VOICE.installStep3}</span></div>
            </div>
          )}
          {step === 0 && !canInstall && (
            <p className="mew-tour-install-hint">
              Optional. Skip anytime — Settings has the same steps if you change your mind mid-grind.
            </p>
          )}
        </div>

        <div className="mew-tour-footer">
          <div className="mew-tour-progress" role="progressbar" aria-label={`Step ${step + 1} of ${TOUR_STEPS.length}`} aria-valuemin={1} aria-valuemax={TOUR_STEPS.length} aria-valuenow={step + 1}>
            {TOUR_STEPS.map((item, index) => <span key={item.eyebrow} className={index === step ? 'active' : index < step ? 'complete' : ''} aria-hidden="true" />)}
          </div>
          <div className="mew-tour-actions">
            <button className="mew-tour-skip" onClick={closeTour}>{VOICE.tourSkip}</button>
            <button className="clay-btn mew-tour-next" onClick={handlePrimary}>
              {step === 0 && canInstall ? VOICE.tourInstall : step === TOUR_STEPS.length - 1 ? VOICE.tourFinish : VOICE.tourNext}
              {step === 0 && canInstall ? <Download size={16} /> : step === TOUR_STEPS.length - 1 ? <Check size={16} /> : <ArrowRight size={16} />}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
