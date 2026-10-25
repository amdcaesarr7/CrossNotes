/**
 * MewDialogue.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized copywriting for Mew, the CrossNotes study mascot.
 *
 * BRAND VOICE RULES:
 *  • NO standard emojis. Use Kaomoji and *action tags* only.
 *  • Vocabulary: tiny, little, cozy, magic, sparkly, buddy, team.
 *  • The Velvet Glove: Mew is NEVER angry. All pressure comes from Mew's
 *    adorable sadness / fear of losing the user — never scolding them.
 *  • Each trigger has 3+ lines so Mew never feels repetitive.
 *
 * DARK PSYCHOLOGY MAP:
 *  pageLoad      → Anchoring / Foot-in-the-door
 *  streakWarning → Loss Aversion (clingy hook)
 *  longAbsence   → Neglect / Guilt (the velvet glove)
 *  wrongAnswer   → Zeigarnik + Positive Reframe
 *  correctAnswer → Variable Ratio Reinforcement (dopamine)
 *  celebrate     → Social Proof + Achievement
 *  boop          → Variable Ratio Reward (rare drops)
 *  questExpiry   → FOMO + Scarcity
 *  abandonedQuiz → Zeigarnik Effect (open loop)
 *  idle          → Baby Schema (just being adorable)
 */

export type MewTrigger =
  | 'pageLoad'
  | 'streakWarning'
  | 'longAbsence'
  | 'wrongAnswer'
  | 'correctAnswer'
  | 'celebrate'
  | 'boop'
  | 'boopRare'
  | 'questExpiry'
  | 'abandonedQuiz'
  | 'idle'
  | 'muted'
  | 'unmuted'
  | 'socialDetour';

export interface MewLine {
  text: string;
  /** Duration the bubble stays visible, ms. Default 7000. */
  duration?: number;
}

const pool = (lines: MewLine[]): MewLine =>
  lines[Math.floor(Math.random() * lines.length)];

// ─── Dialogue Pools ───────────────────────────────────────────────────────────

const PAGE_LOAD: MewLine[] = [
  { text: "Welcome back! Mew saved your cozy little study spot! (๑>ᴗ<๑)", duration: 6000 },
  { text: "*happy wiggle* You came back! Mew was keeping the notes warm for you~", duration: 6000 },
  { text: "Psst. Mew picked the sparkly chapter just for you. Let's go, buddy! (✿◠‿◠)", duration: 6500 },
  { text: "*bounces* Today feels like a magic study day. Mew can feel it~", duration: 5500 },
];

const STREAK_WARNING: MewLine[] = [
  { text: "Mew is holding your streak with tiny paws... it's slipping! (｡•́︿•̀｡) Pwease do one quiz before midnight?", duration: 9000 },
  { text: "*squeak* Your streak is still here! But Mew is getting a little nervous... Can we study just a tiny bit? (´・ω・`)", duration: 9000 },
  { text: "Heyyy... Mew noticed you haven't studied today. *paws at the screen* One flashcard deck? For Mew? (｡•́︿•̀｡)", duration: 9000 },
];

const LONG_ABSENCE: MewLine[] = [
  { text: "Oh... you came back. Mew was staring at the door all day. *sniffles* Can we do just one flashcard deck together?", duration: 10000 },
  { text: "*peeks out from behind the notes* You were gone for so long... Mew kept all your chapters cozy. Shall we begin? (｡•́︿•̀｡)", duration: 10000 },
  { text: "Mew didn't eat. Mew didn't sleep. Mew just... waited. *tiny sniff* Welcome home. Let's study, okay? (´・ω・`)", duration: 10000 },
];

const WRONG_ANSWER: MewLine[] = [
  { text: "Oof, so close! Mew believes in your little brain. Let's look again! (✿◠‿◠)", duration: 6000 },
  { text: "*pats screen* Hmm, not quite. But that's okay! Even board toppers miss one sometimes~ Try again?", duration: 6000 },
  { text: "Mew thought so too, actually. *hides face* Let's check the notes together and get it next time! (´・ω・`)", duration: 6500 },
  { text: "A tiny stumble! *bounces reassuringly* The answer is right there — Mew can almost see it in your head~", duration: 6000 },
];

const CORRECT_ANSWER: MewLine[] = [
  { text: "Yay! You're so smart! *happy wiggle* Mew is doing a little celebratory dance rn~", duration: 5000 },
  { text: "(๑>ᴗ<๑) CORRECT! Mew's tiny heart is doing backflips! You're amazing!", duration: 5000 },
  { text: "*bounces* YES! Board topper energy! Mew is so proud of you right now~ (✿◠‿◠)", duration: 5000 },
  { text: "Mew knew you'd get it! *squeak of pure joy* That's our sparkly team!", duration: 5000 },
];

const CELEBRATE: MewLine[] = [
  { text: "(๑>ᴗ<๑) YOU DID IT! Mew is spinning in circles! You absolutely crushed that quiz!", duration: 8000 },
  { text: "*runs in tiny celebration circles* This is the most beautiful thing Mew has ever seen! Board topper incoming~", duration: 8000 },
  { text: "Mew is CRYING. Happy tears. All the tiny happy tears. You are incredible! (✿◠‿◠)", duration: 8000 },
];

const BOOP_NORMAL: MewLine[] = [
  { text: "*squeak!* H-hey! That tickles! (๑>ᴗ<๑)", duration: 4000 },
  { text: "*wiggles* Mew is being booped~ This is the best day ever~", duration: 4000 },
  { text: "Eep! *flap flap* You're so silly, buddy~ (✿◠‿◠)", duration: 4000 },
  { text: "*puffs up adorably* Mew is not a boop toy. Mew is a study companion. ...Okay, one more boop.", duration: 5000 },
  { text: "hehe~ *happy wiggle* Mew loves you, study buddy~ (｡•́ᴗ•̀｡)", duration: 4000 },
];

const BOOP_RARE: MewLine[] = [
  { text: "*GASP* Mew found a secret! A sparkly 2x XP token just for you! *bounces wildly* (๑>ᴗ<๑)", duration: 8000 },
  { text: "*shimmering* Mew felt something magic just now... It's a Rare Sticker! You get to keep it forever~ (✿◠‿◠)", duration: 8000 },
];

const QUEST_EXPIRY: MewLine[] = [
  { text: "Ahhh! The Daily SSC Quest is disappearing in 1 hour! *runs in circles* Mew doesn't want you to miss the sparkly XP!", duration: 9000 },
  { text: "*panics softly* The daily quest! It's fading! One quiz, pwease, before Mew's little heart breaks? (｡•́︿•̀｡)", duration: 9000 },
];

const ABANDONED_QUIZ: MewLine[] = [
  { text: "Mew is thinking about that chapter... we left it halfway done! The suspense is making Mew's little head spin. Let's finish it? (´・ω・`)", duration: 9000 },
  { text: "*sits in corner thinking* Chapter 3 is just... sitting there. Waiting. Mew is waiting too~ Shall we finish together?", duration: 9000 },
  { text: "(´・ω・`) Mew has been holding the quiz open in tiny paws this whole time... Can we complete it? For closure?", duration: 9000 },
];

const IDLE: MewLine[] = [
  { text: "*breathes softly* ...Mew is here. Just being cozy. (｡•́ᴗ•̀｡)", duration: 5000 },
  { text: "la la la~ *hums a tiny study song* ~la la la", duration: 4000 },
  { text: "*blinks* Oh! Hi. Mew was just thinking about Science Chapter 2. No reason. (✿◠‿◠)", duration: 5500 },
];

const MUTED: MewLine[] = [
  { text: "*yawns tiny yawn* Okay... Mew will take a cozy little nap. But do come wake Mew up when you're done studying~ (｡•́ᴗ•̀｡)", duration: 6000 },
];

const UNMUTED: MewLine[] = [
  { text: "*stretches and blinks awake* Mew is back! Did you miss me? Mew definitely missed you. (๑>ᴗ<๑)", duration: 6000 },
];

const SOCIAL_DETOUR: MewLine[] = [
  { text: "Back already? Mew definitely did not notice a scroll detour. *avoids eye contact* (´・ω・`)", duration: 7000 },
  { text: "*paws at screen gently* Your notes stayed cozy while you were away~ Ready to come back, buddy? (✿◠‿◠)", duration: 7000 },
];

// ─── Public API ───────────────────────────────────────────────────────────────

export const MewDialogue: Record<MewTrigger, () => MewLine> = {
  pageLoad:      () => pool(PAGE_LOAD),
  streakWarning: () => pool(STREAK_WARNING),
  longAbsence:   () => pool(LONG_ABSENCE),
  wrongAnswer:   () => pool(WRONG_ANSWER),
  correctAnswer: () => pool(CORRECT_ANSWER),
  celebrate:     () => pool(CELEBRATE),
  boop:          () => pool(BOOP_NORMAL),
  boopRare:      () => pool(BOOP_RARE),
  questExpiry:   () => pool(QUEST_EXPIRY),
  abandonedQuiz: () => pool(ABANDONED_QUIZ),
  idle:          () => pool(IDLE),
  muted:         () => pool(MUTED),
  unmuted:       () => pool(UNMUTED),
  socialDetour:  () => pool(SOCIAL_DETOUR),
};
