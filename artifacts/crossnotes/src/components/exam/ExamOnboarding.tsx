// Onboarding sheet: user picks first language and second/third language.
// Renders as a bottom sheet over the page. Keyboard-accessible.
import { useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExam } from '@/contexts/ExamContext';
import { FIRST_LANG_OPTIONS, SECOND_LANG_OPTIONS } from '@/data/examTimetable';

type Step = 'first' | 'second';

export default function ExamOnboarding() {
  const { prefs, setFirstLang, setSecondLang, completeOnboarding } = useExam();
  const [step, setStep] = useState<Step>('first');
  const [localFirst, setLocalFirst] = useState(prefs.firstLang || '');
  const [localSecond, setLocalSecond] = useState(prefs.secondLang || '');

  function handleFirstNext() {
    if (!localFirst) return;
    setFirstLang(localFirst);
    setStep('second');
  }

  function handleDone() {
    setSecondLang(localSecond);
    completeOnboarding();
  }

  return (
    <div
      className="exam-onboarding-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Exam Mode setup"
    >
      <div className="exam-onboarding-sheet clay-card sheet-pop">
        <div className="exam-onboarding-header">
          <h2 className="font-display font-bold text-lg" style={{ color: 'var(--text)' }}>
            {step === 'first' ? 'Your First Language' : 'Second / Third Language'}
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {step === 'first'
              ? 'Select the language you are appearing for as First Language.'
              : 'Select your Second or Third Language paper, or None if not applicable.'}
          </p>
        </div>

        <div className="exam-onboarding-options" role="listbox" aria-label={step === 'first' ? 'First language options' : 'Second language options'}>
          {(step === 'first' ? FIRST_LANG_OPTIONS : SECOND_LANG_OPTIONS).map(lang => {
            const selected = step === 'first' ? localFirst === lang : localSecond === lang;
            return (
              <button
                key={lang}
                role="option"
                aria-selected={selected}
                className={cn('exam-lang-option', selected && 'selected')}
                onClick={() => step === 'first' ? setLocalFirst(lang) : setLocalSecond(lang)}
              >
                <span>{lang}</span>
                {selected && <Check size={16} aria-hidden="true" />}
              </button>
            );
          })}
        </div>

        <div className="exam-onboarding-actions">
          {step === 'second' && (
            <button
              className="clay-btn-ghost"
              onClick={() => setStep('first')}
              aria-label="Go back to first language selection"
            >
              Back
            </button>
          )}
          {step === 'first' ? (
            <button
              className="clay-btn"
              onClick={handleFirstNext}
              disabled={!localFirst}
              aria-disabled={!localFirst}
            >
              Next
              <ChevronDown size={16} aria-hidden="true" style={{ transform: 'rotate(-90deg)' }} />
            </button>
          ) : (
            <button
              className="clay-btn"
              onClick={handleDone}
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
