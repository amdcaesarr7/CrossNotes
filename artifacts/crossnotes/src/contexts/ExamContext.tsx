import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { type ExamGroup } from '@/data/examTimetable';

export interface ExamPrefs {
  onboardingDone: boolean;
  firstLang: string;
  secondLang: string;
  // Subject strength ratings: 1 = very weak, 5 = strong
  subjectRatings: Partial<Record<ExamGroup, number>>;
  // Completed planner task IDs: "{examGroup}:{YYYY-MM-DD}:{taskType}"
  completedTaskIds: string[];
}

const DEFAULT_PREFS: ExamPrefs = {
  onboardingDone: false,
  firstLang: '',
  secondLang: '',
  subjectRatings: {},
  completedTaskIds: [],
};

const LS_KEY = 'cn-exam-prefs';

function loadPrefs(): ExamPrefs {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

function savePrefs(prefs: ExamPrefs): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(prefs));
  } catch {}
}

interface ExamContextType {
  prefs: ExamPrefs;
  setFirstLang: (lang: string) => void;
  setSecondLang: (lang: string) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  setRating: (id: ExamGroup, rating: number) => void;
  toggleTask: (taskId: string) => void;
  isTaskDone: (taskId: string) => boolean;
}

const ExamContext = createContext<ExamContextType>({
  prefs: DEFAULT_PREFS,
  setFirstLang: () => {},
  setSecondLang: () => {},
  completeOnboarding: () => {},
  resetOnboarding: () => {},
  setRating: () => {},
  toggleTask: () => {},
  isTaskDone: () => false,
});

export function ExamProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<ExamPrefs>(loadPrefs);

  // Persist on every change
  useEffect(() => {
    savePrefs(prefs);
  }, [prefs]);

  const setFirstLang = useCallback((lang: string) => {
    setPrefs(p => ({ ...p, firstLang: lang }));
  }, []);

  const setSecondLang = useCallback((lang: string) => {
    setPrefs(p => ({ ...p, secondLang: lang }));
  }, []);

  const completeOnboarding = useCallback(() => {
    setPrefs(p => ({ ...p, onboardingDone: true }));
  }, []);

  const resetOnboarding = useCallback(() => {
    setPrefs(p => ({
      ...p,
      onboardingDone: false,
      firstLang: '',
      secondLang: '',
    }));
  }, []);

  const setRating = useCallback((id: ExamGroup, rating: number) => {
    setPrefs(p => ({
      ...p,
      subjectRatings: { ...p.subjectRatings, [id]: rating },
    }));
  }, []);

  const toggleTask = useCallback((taskId: string) => {
    setPrefs(p => {
      const done = p.completedTaskIds.includes(taskId);
      return {
        ...p,
        completedTaskIds: done
          ? p.completedTaskIds.filter(id => id !== taskId)
          : [...p.completedTaskIds, taskId],
      };
    });
  }, []);

  const isTaskDone = useCallback(
    (taskId: string) => prefs.completedTaskIds.includes(taskId),
    [prefs.completedTaskIds],
  );

  return (
    <ExamContext.Provider
      value={{
        prefs,
        setFirstLang,
        setSecondLang,
        completeOnboarding,
        resetOnboarding,
        setRating,
        toggleTask,
        isTaskDone,
      }}
    >
      {children}
    </ExamContext.Provider>
  );
}

export const useExam = () => useContext(ExamContext);
