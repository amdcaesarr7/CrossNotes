import { useEffect } from 'react';
import { toast } from 'sonner';
import { WifiOff } from 'lucide-react';

const OFFLINE_TOAST_ID = 'cn-offline';

/**
 * Low-key persistent notice while the device is offline. Study content the
 * student has already opened keeps working (service-worker cache), so this is
 * reassurance rather than an error. Auto-dismisses the moment the connection
 * returns. Renders nothing itself — it just drives a sonner toast.
 */
export default function OfflineNotice() {
  useEffect(() => {
    const goOffline = () =>
      toast('You’re offline — saved study content still works', {
        id: OFFLINE_TOAST_ID,
        icon: <WifiOff size={18} />,
        duration: Infinity,
      });
    const goOnline = () => toast.dismiss(OFFLINE_TOAST_ID);

    if (typeof navigator !== 'undefined' && !navigator.onLine) goOffline();
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  return null;
}
