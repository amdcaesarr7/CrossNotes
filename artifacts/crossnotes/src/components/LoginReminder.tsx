import { useEffect, useState } from 'react';
import { LogIn, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const REMINDER_KEY = 'cn-login-reminder-shown';

export default function LoginReminder() {
  const { user, loading, signInWithGoogle } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (loading || user) return;

    try {
      if (sessionStorage.getItem(REMINDER_KEY) === 'true') return;
      const timer = window.setTimeout(() => {
        sessionStorage.setItem(REMINDER_KEY, 'true');
        setVisible(true);
      }, 8_000);
      return () => window.clearTimeout(timer);
    } catch {
      setVisible(true);
    }
    return undefined;
  }, [loading, user]);

  if (!visible || user) return null;

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      setVisible(false);
    } catch (error) {
      console.error('[LoginReminder] Sign-in failed:', error);
      toast.error('Sign-in did not complete. You can try again from the account button.');
    }
  };

  return (
    <aside className="login-reminder" role="status" aria-live="polite">
      <div className="login-reminder-copy">
        <strong>Save your study progress</strong>
        <span>Sign in to keep XP, streaks, notes, and quiz progress across devices.</span>
      </div>
      <button type="button" className="login-reminder-action" onClick={handleSignIn}>
        <LogIn size={15} aria-hidden="true" /> Sign in
      </button>
      <button type="button" className="login-reminder-close" onClick={() => setVisible(false)} aria-label="Dismiss sign-in reminder">
        <X size={16} aria-hidden="true" />
      </button>
    </aside>
  );
}
