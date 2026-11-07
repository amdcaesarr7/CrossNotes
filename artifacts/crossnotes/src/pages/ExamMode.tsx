// Exam Mode page — Maharashtra SSC (Std X) Feb-Mar 2027
// Tabs: Countdown, Planner, Timetable
import { useState } from 'react';
import { Settings2 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useExam } from '@/contexts/ExamContext';
import {
  EXAM_TIMETABLE,
  type ExamEntry,
} from '@/data/examTimetable';
import AppHeader from '@/components/AppHeader';
import BottomNav from '@/components/BottomNav';
import ExamOnboarding from '@/components/exam/ExamOnboarding';
import ExamCountdown from '@/components/exam/ExamCountdown';
import ExamTimeline from '@/components/exam/ExamTimeline';
import StudyPlanner from '@/components/exam/StudyPlanner';
import '../crossnotes.css';

type Tab = 'countdown' | 'planner' | 'timetable';

function filterEntries(entries: ExamEntry[], firstLang: string, secondLang: string): ExamEntry[] {
  return entries.filter(entry => {
    // Core subjects (not language-specific) always shown
    if (!entry.firstLangOptions && !entry.secondLangOptions) return true;

    const matchesFirst =
      entry.firstLangOptions && entry.firstLangOptions.includes(firstLang);
    const matchesSecond =
      entry.secondLangOptions && secondLang && secondLang !== 'None' &&
      entry.secondLangOptions.includes(secondLang);

    // If this entry has firstLangOptions, show if user's first lang matches
    if (entry.firstLangOptions && !entry.secondLangOptions) return !!matchesFirst;
    // If this entry has secondLangOptions, show if user's second lang matches
    if (entry.secondLangOptions && !entry.firstLangOptions) return !!matchesSecond;
    // Both
    return !!(matchesFirst || matchesSecond);
  });
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'countdown', label: 'Countdown' },
  { id: 'planner',  label: 'Planner'   },
  { id: 'timetable', label: 'Timetable' },
];

export default function ExamMode() {
  const { isDark } = useTheme();
  const { prefs, resetOnboarding } = useExam();
  const [activeTab, setActiveTab] = useState<Tab>('countdown');

  const filteredEntries = filterEntries(EXAM_TIMETABLE, prefs.firstLang, prefs.secondLang);

  return (
    <div className={`cn-body ${isDark ? 'dark-mode' : ''}`}>
      <AppHeader title="Exam Mode" />

      <main className="page-content">
        {/* Show onboarding sheet if not done */}
        {!prefs.onboardingDone && <ExamOnboarding />}

        {/* Exam period header */}
        <div className="exam-hero clay-card">
          <div className="exam-hero-title">Maharashtra SSC Board 2027</div>
          <div className="exam-hero-subtitle">February &ndash; March 2027 &middot; Std X</div>
          {prefs.onboardingDone && (
            <div className="exam-hero-langs">
              <span className="exam-hero-tag">{prefs.firstLang} (First)</span>
              {prefs.secondLang && prefs.secondLang !== 'None' && (
                <span className="exam-hero-tag">{prefs.secondLang} (Second / Third)</span>
              )}
              <button
                className="clay-btn-ghost exam-hero-change-btn"
                onClick={resetOnboarding}
                aria-label="Change language preferences"
              >
                <Settings2 size={13} aria-hidden="true" />
                Change
              </button>
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div className="exam-tabs" role="tablist" aria-label="Exam mode sections">
          {TABS.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`exam-panel-${tab.id}`}
              id={`exam-tab-${tab.id}`}
              className={`exam-tab-btn${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        <div
          id={`exam-panel-countdown`}
          role="tabpanel"
          aria-labelledby="exam-tab-countdown"
          hidden={activeTab !== 'countdown'}
        >
          <ExamCountdown entries={filteredEntries} />
        </div>

        <div
          id={`exam-panel-planner`}
          role="tabpanel"
          aria-labelledby="exam-tab-planner"
          hidden={activeTab !== 'planner'}
        >
          <StudyPlanner entries={filteredEntries} />
        </div>

        <div
          id={`exam-panel-timetable`}
          role="tabpanel"
          aria-labelledby="exam-tab-timetable"
          hidden={activeTab !== 'timetable'}
        >
          <ExamTimeline entries={filteredEntries} />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
