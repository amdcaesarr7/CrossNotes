import { useEffect, useState } from 'react';
import { Download, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { isVaultFileSaved, saveVaultFile, removeVaultFile } from '@/lib/offlineVault';

type State = 'unknown' | 'saved' | 'not-saved' | 'saving' | 'removing';

/**
 * Small "Save offline" toggle shown on local Vault entries. Lives *inside* the
 * entry's <a>, so its handler stops propagation + prevents default to avoid
 * opening/downloading the file when tapped. Writes to the opt-in Vault cache
 * (src/lib/offlineVault.ts); the service worker serves it back when offline.
 */
export default function VaultOfflineButton({ url, title }: { url: string; title: string }) {
  const [state, setState] = useState<State>('unknown');

  useEffect(() => {
    let alive = true;
    isVaultFileSaved(url).then((saved) => {
      if (alive) setState(saved ? 'saved' : 'not-saved');
    });
    return () => {
      alive = false;
    };
  }, [url]);

  const busy = state === 'saving' || state === 'removing';

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;

    if (state === 'saved') {
      setState('removing');
      try {
        await removeVaultFile(url);
        setState('not-saved');
        toast('Removed from offline');
      } catch {
        setState('saved');
        toast.error('Couldn’t remove — try again');
      }
      return;
    }

    setState('saving');
    try {
      await saveVaultFile(url);
      setState('saved');
      toast.success(`Saved for offline — “${title}” now works without internet`);
    } catch {
      setState('not-saved');
      toast.error(navigator.onLine ? 'Couldn’t save — try again' : 'Connect to the internet to save this for offline');
    }
  };

  const label =
    state === 'saved' ? 'Saved' : state === 'saving' ? 'Saving…' : state === 'removing' ? 'Removing…' : 'Save offline';
  const Icon = state === 'saved' ? Check : busy ? Loader2 : Download;
  const isSaved = state === 'saved';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-label={isSaved ? `Remove ${title} from offline` : `Save ${title} for offline`}
      title={label}
      className={`cn-offline-btn${isSaved ? ' is-saved' : ''}`}
    >
      <Icon size={13} className={busy ? 'animate-spin' : ''} />
      <span>{label}</span>
    </button>
  );
}
