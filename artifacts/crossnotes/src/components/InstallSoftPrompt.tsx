import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import InstallSheet from '@/components/InstallSheet';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import {
  STUDY_COMPLETE_EVENT,
  canOfferInstallSoftPrompt,
  markInstallSoftShownThisSession,
} from '@/lib/installPrompt';
import { VOICE } from '@/lib/voice';
import { sfx } from '@/lib/sfx';

const SHOW_DELAY_MS = 1400;

/**
 * Global host: listens for study completion, shows InstallSheet once per eligible session,
 * and celebrates successful PWA install.
 */
export default function InstallSoftPrompt() {
  const { installed } = useInstallPrompt();
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const celebratedInstall = useRef(false);

  useEffect(() => {
    const onStudy = () => {
      if (!canOfferInstallSoftPrompt(installed)) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (!canOfferInstallSoftPrompt(installed)) return;
        markInstallSoftShownThisSession();
        setOpen(true);
      }, SHOW_DELAY_MS);
    };

    window.addEventListener(STUDY_COMPLETE_EVENT, onStudy);
    return () => {
      window.removeEventListener(STUDY_COMPLETE_EVENT, onStudy);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [installed]);

  useEffect(() => {
    if (installed) setOpen(false);
  }, [installed]);

  useEffect(() => {
    const onInstalled = () => {
      if (celebratedInstall.current) return;
      celebratedInstall.current = true;
      setOpen(false);
      sfx.installSuccess();
      toast.success(VOICE.installSuccessToast, { duration: 3500 });
    };
    window.addEventListener('appinstalled', onInstalled);
    return () => window.removeEventListener('appinstalled', onInstalled);
  }, []);

  return <InstallSheet open={open} onClose={() => setOpen(false)} mode="soft" />;
}
