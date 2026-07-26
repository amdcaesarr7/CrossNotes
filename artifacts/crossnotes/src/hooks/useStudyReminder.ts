import { useEffect } from "react";
import { maybeShowStudyReminder } from "@/lib/notifications";

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Polls while the app is open and fires a single reminder notification per
 * day (evening, if the user opted in and hasn't studied yet). See
 * `src/lib/notifications.ts` for why this can't reach a fully-closed app.
 */
export function useStudyReminder(studiedToday: boolean) {
  useEffect(() => {
    maybeShowStudyReminder(studiedToday);
    const id = setInterval(() => maybeShowStudyReminder(studiedToday), CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [studiedToday]);
}
