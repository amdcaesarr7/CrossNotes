export interface Potion {
  id: string;
  name: string;
  emoji: string;       // always-available fallback
  imageSrc?: string;    // optional icon — falls back to emoji if missing/fails to load
  cost: number;         // coins
  multiplier: number;   // XP multiplier while active (only used for kind: 'xp_boost')
  durationMin: number;  // minutes active (0 = instant effect)
  kind: "xp_boost" | "streak_shield" | "nickname_tag";
  tagline: string;      // sarcastic one-liner shown in the shop
  description: string;  // what it actually does
}

/**
 * Icons live at /public/icons/*.svg (shipped with the app — see potion-2x.svg,
 * potion-nickname.svg, potion-shield.svg). If you swap in your own art and typo
 * a path, or a file goes missing, <PotionIcon> automatically falls back to the
 * emoji and logs a console.warn so it's obvious in devtools rather than
 * silently invisible.
 */
export const POTIONS: Potion[] = [
  {
    id: "xp_2x_30",
    name: "2x XP Potion",
    emoji: "🧪",
    imageSrc: "/icons/potion-2x.svg",
    cost: 20,
    multiplier: 2,
    durationMin: 30,
    kind: "xp_boost",
    tagline: "Doubles your XP. Does not double your attention span.",
    description: "2x XP on everything you earn for the next 30 minutes.",
  },
  {
    id: "nickname_tag",
    name: "Nickname Tag",
    emoji: "🏷️",
    imageSrc: "/icons/potion-nickname.svg",
    cost: 15,
    multiplier: 1,
    durationMin: 0,
    kind: "nickname_tag",
    tagline: "Purely cosmetic. Purely iconic. Flex on the leaderboard.",
    description: "Unlocks a custom nickname shown next to your name on the leaderboard.",
  },
  {
    id: "streak_shield",
    name: "Streak Shield",
    emoji: "🧊",
    imageSrc: "/icons/potion-shield.svg",
    cost: 30,
    multiplier: 1,
    durationMin: 0,
    kind: "streak_shield",
    tagline: "For the days your motivation ghosts you like a bad situationship.",
    description: "Instantly banks +1 streak freeze — covers one missed day.",
  },
];

export function getPotion(id: string): Potion | undefined {
  return POTIONS.find((p) => p.id === id);
}
