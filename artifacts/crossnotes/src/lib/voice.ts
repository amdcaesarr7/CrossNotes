/**
 * CrossNotes voice — sarcastic, warm, Indian teen humour.
 *
 * Tone: roast lightly, never bully. Board-exam anxiety is the shared joke.
 * Hindi-English mix is fine in motivational lines; UI chrome stays clear English
 * with attitude. No parental lectures. No cringe corporate “synergy”.
 *
 * Use these strings (or match this vibe) anywhere user-facing copy is written.
 */

export const VOICE = {
  /** Short product tagline */
  tagline: 'Board prep that actually judges you (lovingly).',

  guestGreeting: 'CrossNotes',
  guestSub: 'Maharashtra 10th — lock in before Sharma ji’s beta does.',

  studiedToday: 'Streak safe. Sharma ji can wait.',
  notStudiedNudge: 'Your streak is hanging by a thread. One chapter. Go.',

  signInCta: 'Sign in with Google — XP doesn’t grow on trees',
  signInHint: 'Save progress before your cousin asks for your marks.',

  continueLearning: 'Pick up where you ghosted',
  startStudying: 'Pick a subject and lock in →',
  needsRevision: 'These chapters said “hi, remember me?”',
  visitShop: 'Spend coins like a menace →',
  earnXpToday: 'How XP actually drops',
  yourSubjects: 'Your subjects',
  seeAllSubjects: 'See all →',
  topStudiers: 'Top studiers',
  fullLeaderboard: 'Full leaderboard →',
  vaultTeaserTitle: 'The Vault',
  vaultTeaserBody: 'Board papers, textbook links, open resources — no WhatsApp PDF archaeology.',
  beFirstRank: 'Be the first to earn XP and claim #1. Peer pressure, but useful.',

  reminderTitle: 'Mew will nag you (for science)',
  reminderBody: 'Evening ping if your “I’ll study later” becomes a personality.',
  reminderEnable: 'Fine, nag me',

  settingsKicker: 'Control room',
  settingsTitle: 'Settings — don’t mess it up',
  settingsAppearance: 'Vibes',
  settingsInstall: 'Make it an app already',

  themeLightTitle: 'Light mode',
  themeLightHint: 'Bright enough to study. Painful enough to stay awake.',
  themeDarkTitle: 'Dark mode',
  themeDarkHint: 'For 11pm warriors and people hiding from parents.',

  soundOnTitle: 'Sound effects on',
  soundOnHint: 'Tiny pings when you cook. Mute anytime.',
  soundOffTitle: 'Sound effects off',
  soundOffHint: 'Silent grind. Library vibes. Respect.',

  installedTitle: 'Already on your home screen',
  installedHint: 'Full-screen, offline-friendly, zero “wait which tab was it”.',
  installTitle: 'Install CrossNotes',
  installHint: 'One tap away. Feels like a real app. Parents think you’re “being productive”.',
  installBtn: 'Install now',
  showInstallFallback: 'Show install steps',
  hideInstallFallback: 'Hide install steps',
  installGuide: 'Browser being weird? Use the menu → Install app / Add to Home screen / Create shortcut.',
  installStep1: 'Open the browser menu',
  installStep2Ios: 'Tap Share',
  installStep2Other: 'Pick Install or Create shortcut',
  installStep3: 'Add CrossNotes to home screen',

  softInstallKicker: 'Pro move unlocked',
  softInstallTitle: 'You studied. Now stop hunting for the tab.',
  softInstallBody: 'Park CrossNotes on your home screen — opens like an app, works offline, zero “wait which Chrome tab was notes”.',
  softInstallPrimary: 'Install CrossNotes',
  softInstallSecondary: 'Not now, I’m chaotic',
  softInstallIosHint: 'iPhone moment: Safari → Share → Add to Home Screen. Yes, Apple made it weird on purpose.',
  installSuccessToast: 'Installed. Home screen looks slightly more toppish now.',
  installBenefitsOffline: 'Offline notes when Jio decides to nap',
  installBenefitsFast: 'One tap. No tab archaeology.',
  installBenefitsFullscreen: 'Full screen. Browser chrome can take a seat.',

  feedbackMenu: 'Roast us / tip us',
  feedbackTitle: 'Spill the chai',
  feedbackLead: 'Bug, idea, or unhinged encouragement — we read it.',
  feedbackSuccessTitle: 'Message yeeted into the void (we got it).',
  feedbackSuccessBody: 'Thanks. You just made CrossNotes slightly less chaotic.',
  feedbackSend: 'Send it',
  feedbackBack: 'Back to grinding',

  tourSkip: 'Skip, I’m built different',
  tourNext: 'Next',
  tourInstall: 'Install CrossNotes',
  tourFinish: 'Let’s cook',

  accountProgress: 'Progress',
  accountCredits: 'Credits & sources',
  accountSettings: 'Settings',
  accountSignOut: 'Sign out (dramatic exit)',
} as const;

/** Daily dashboard lines — Indian adolescent sarcasm, board-exam flavoured. */
export const DAILY_ROASTS = [
  "Bua ka beta is revising rn. You’re really going to lose to him?",
  "Sharma ji’s son just finished Chapter 4. Touch some notes.",
  "Mew is watching your streak. One quiz. Don’t embarrass the bear.",
  "Boards don’t take ‘mood nahi tha’ as an answer. Lock in.",
  "Science is just nature’s gossip. Catch up.",
  "Every XP is one step away from exam-day crying. Nice.",
  "Duolingo owl called. Said you’re free for maths. Rude but fair.",
  "Today’s grind = tomorrow’s mark sheet. Simple maths.",
  "Your notes app history is longer than your study streak. Fix that.",
  "Relatives at Diwali will ask percentage. This is your villain origin story.",
  "Phone battery at 12%. Same energy as your revision plan?",
  "‘I’ll start from tomorrow’ — famous last words of every average.",
] as const;

export function dailyRoast(date = new Date()): string {
  return DAILY_ROASTS[date.getDay() % DAILY_ROASTS.length];
}

export function greetFirstName(displayName: string | null | undefined): string {
  const first = displayName?.trim().split(/\s+/)[0];
  return first ? `Hey ${first}` : 'Hey scholar';
}

/** First-use tour steps — same voice, still clear. */
export const TOUR_STEPS = [
  {
    eyebrow: 'Home-screen era',
    title: 'One-tap CrossNotes > tab chaos',
    copy: 'Install optional, strongly recommended. Fast open, offline notes, sits next to Instagram (character development).',
  },
  {
    eyebrow: 'Meet the judge',
    title: 'This is Mew. Emotionally available. Slightly judgy.',
    copy: 'Wins get celebrations. Suspicious scrolling gets side-eye. Streak defence is unpaid overtime.',
  },
  {
    eyebrow: 'The loop',
    title: 'Subject → notes → flashcards → quiz. Collect XP. Flex later.',
    copy: 'Each chapter is a tiny boss fight. Finish the loop or the XP stays theoretical.',
  },
  {
    eyebrow: 'Momentum',
    title: 'Small sessions still count. Ghosting doesn’t.',
    copy: 'Dashboard remembers where you left off. Reminders optional — for when “later” becomes never.',
  },
] as const;
