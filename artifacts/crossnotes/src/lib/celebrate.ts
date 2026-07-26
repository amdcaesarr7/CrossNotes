import { toast } from "sonner";
import { sfx } from "@/lib/sfx";
import { fireConfetti } from "@/lib/confetti";
import type { ActivityResult } from "@/hooks/useFirestore";

/**
 * Shared level-up / streak-freeze celebration — fired from Notes, Flashcards,
 * and Quiz after any XP-earning action, so the feel is consistent no matter
 * which activity triggered it.
 */
export function celebrateActivityResult(
  result: Pick<ActivityResult, "leveledUp" | "levelName" | "streakFreezeEarned" | "streakFreezeUsed">,
) {
  if (result.leveledUp) {
    sfx.levelUp();
    fireConfetti({ count: 180 });
    toast.success(`🆙 Level up! You're now "${result.levelName}"`, { duration: 3500 });
  }
  if (result.streakFreezeEarned) {
    sfx.streakMilestone();
    toast.success("🧊 Streak freeze earned! Miss a day worry-free.", { duration: 3500 });
  } else if (result.streakFreezeUsed) {
    sfx.streakSaved();
    toast("🧊 A streak freeze covered your missed day — streak safe!", { duration: 3500 });
  }
}
