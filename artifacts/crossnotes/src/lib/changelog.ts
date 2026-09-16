export interface ChangelogEntry {
  date: string;
  title: string;
  copy: string;
}

export const changelog: ChangelogEntry[] = [
  { date: '2026-09-16', title: 'A calmer place to tune CrossNotes', copy: 'Settings now gathers appearance, reminders, personalization, offline Vault storage, and install help in one place.' },
  { date: '2026-09-10', title: 'Vault files can travel with you', copy: 'Save supported Vault resources for offline revision and manage them whenever you like.' },
  { date: '2026-09-01', title: 'A more helpful first hello', copy: 'Onboarding and install education now show clearer, illustrated study flows.' },
];

const SEEN_KEY = 'cn.changelog.lastSeen';

export function getUnseenChangelog(): ChangelogEntry[] {
  try {
    const seen = localStorage.getItem(SEEN_KEY);
    return seen ? changelog.filter((entry) => entry.date > seen) : [];
  } catch {
    return [];
  }
}

export function markChangelogSeen() {
  try { localStorage.setItem(SEEN_KEY, changelog[0]?.date ?? ''); } catch { /* best effort */ }
}
