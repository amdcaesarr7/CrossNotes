// Maharashtra SSC (Std X) Feb-Mar 2027 Exam Timetable
// Edit this file to update dates, times, or subjects.
// All times are in Asia/Kolkata (IST).

export type ExamGroup =
  | 'lang-first'
  | 'lang-second-a'
  | 'lang-second-b'
  | 'english'
  | 'hindi-second'
  | 'composite'
  | 'maths-1'
  | 'maths-2'
  | 'sci-1'
  | 'sci-2'
  | 'social-1'
  | 'social-2';

export interface ExamEntry {
  id: ExamGroup;
  date: string;        // YYYY-MM-DD
  startTime: string;   // HH:MM 24h IST
  endTime: string;     // HH:MM 24h IST
  label: string;       // Display name
  subLabel?: string;   // Optional secondary descriptor
  linkedSlug?: string; // CrossNotes subject slug for direct link
  // Languages included in this paper slot (used for onboarding filter)
  firstLangOptions?: string[];
  secondLangOptions?: string[];
}

// First language options for onboarding picker
export const FIRST_LANG_OPTIONS: string[] = [
  'Marathi',
  'Hindi',
  'Urdu',
  'English',
  'Semi-English',
];

// Second / Third language options for onboarding picker
export const SECOND_LANG_OPTIONS: string[] = [
  'Marathi',
  'Kannada',
  'Tamil',
  'Telugu',
  'Malayalam',
  'Sindhi',
  'Bengali',
  'Punjabi',
  'Urdu',
  'Gujarati',
  'Sanskrit',
  'Pali',
  'Ardhamagadhi',
  'Persian',
  'Arabic',
  'Avesta',
  'Pahalavi',
  'Russian',
  'Hindi',
  'None',
];

export const EXAM_TIMETABLE: ExamEntry[] = [
  {
    id: 'lang-first',
    date: '2027-02-15',
    startTime: '11:00',
    endTime: '14:00',
    label: 'First Language',
    subLabel: 'Marathi, Hindi, Urdu, etc.',
    firstLangOptions: ['Marathi', 'Hindi', 'Urdu', 'English', 'Semi-English'],
  },
  {
    id: 'lang-second-a',
    date: '2027-02-18',
    startTime: '11:00',
    endTime: '14:00',
    label: 'Second / Third Language',
    subLabel: 'Marathi, Kannada, Tamil, Telugu, Malayalam, Sindhi, Bengali, Punjabi',
    secondLangOptions: ['Marathi', 'Kannada', 'Tamil', 'Telugu', 'Malayalam', 'Sindhi', 'Bengali', 'Punjabi'],
  },
  {
    id: 'lang-second-b',
    date: '2027-02-20',
    startTime: '11:00',
    endTime: '14:00',
    label: 'Second / Third Language',
    subLabel: 'Urdu, Gujarati, Sanskrit, Pali, Ardhamagadhi, Persian, Arabic, Avesta, Pahalavi, Russian',
    secondLangOptions: ['Urdu', 'Gujarati', 'Sanskrit', 'Pali', 'Ardhamagadhi', 'Persian', 'Arabic', 'Avesta', 'Pahalavi', 'Russian'],
  },
  {
    id: 'english',
    date: '2027-02-22',
    startTime: '11:00',
    endTime: '14:00',
    label: 'English',
    subLabel: 'First / Third Language',
    linkedSlug: 'english',
  },
  {
    id: 'hindi-second',
    date: '2027-02-24',
    startTime: '11:00',
    endTime: '14:00',
    label: 'Hindi',
    subLabel: 'Second / Third Language',
    linkedSlug: 'hindi',
    secondLangOptions: ['Hindi'],
  },
  {
    id: 'composite',
    date: '2027-02-26',
    startTime: '11:00',
    endTime: '13:00',
    label: 'Composite Language Courses',
    subLabel: 'Two-language composite papers',
  },
  {
    id: 'maths-1',
    date: '2027-03-02',
    startTime: '11:00',
    endTime: '13:00',
    label: 'Mathematics Part I',
    subLabel: 'Algebra',
    linkedSlug: 'maths-1',
  },
  {
    id: 'maths-2',
    date: '2027-03-04',
    startTime: '11:00',
    endTime: '13:00',
    label: 'Mathematics Part II',
    subLabel: 'Geometry',
    linkedSlug: 'maths-2',
  },
  {
    id: 'sci-1',
    date: '2027-03-08',
    startTime: '11:00',
    endTime: '13:00',
    label: 'Science and Technology Part I',
    linkedSlug: 'science-1',
  },
  {
    id: 'sci-2',
    date: '2027-03-11',
    startTime: '11:00',
    endTime: '13:00',
    label: 'Science and Technology Part II',
    linkedSlug: 'science-2',
  },
  {
    id: 'social-1',
    date: '2027-03-13',
    startTime: '11:00',
    endTime: '13:00',
    label: 'Social Sciences Paper I',
    subLabel: 'History and Political Science',
    linkedSlug: 'history',
  },
  {
    id: 'social-2',
    date: '2027-03-15',
    startTime: '11:00',
    endTime: '13:00',
    label: 'Social Sciences Paper II',
    subLabel: 'Geography',
    linkedSlug: 'geography',
  },
];

// Returns the exam date as a Date object at exam start time in IST.
export function examStartIST(entry: ExamEntry): Date {
  const [h, m] = entry.startTime.split(':').map(Number);
  // IST = UTC+5:30. Construct ISO string in UTC that equals IST start.
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const [year, month, day] = entry.date.split('-').map(Number);
  const utcMs =
    Date.UTC(year, month - 1, day, h, m, 0, 0) - istOffsetMs;
  return new Date(utcMs);
}
