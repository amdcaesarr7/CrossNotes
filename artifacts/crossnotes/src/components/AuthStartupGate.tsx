import { useEffect, useState, type ReactNode } from 'react';
import { BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

interface AuthStartupGateProps {
  children: ReactNode;
}

/**
 * Prevents Firebase's asynchronous session restoration from briefly rendering
 * signed-out UI for learners who already have a persisted CrossNotes session.
 */
export default function AuthStartupGate({ children }: AuthStartupGateProps) {
  const { loading, isFirebaseReady } = useAuth();
  const { isDark } = useTheme();
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    if (!isFirebaseReady || !loading) {
      setShowFallback(false);
      return;
    }

    const timeout = window.setTimeout(() => setShowFallback(true), 900);
    return () => window.clearTimeout(timeout);
  }, [isFirebaseReady, loading]);

  // Render the app immediately while Firebase restores the session. Only show
  // the startup panel when auth is unusually slow, so reloads never feel like
  // the whole app is starting from scratch.
  if (!isFirebaseReady || !loading || !showFallback) return <>{children}</>;

  return (
    <main className={`cn-body auth-startup-gate ${isDark ? 'dark-mode' : ''}`} aria-busy="true">
      <section className="auth-startup-panel" role="status" aria-live="polite" aria-label="Restoring your CrossNotes session">
        <div className="auth-startup-mark" aria-hidden="true"><BookOpen size={28} /></div>
        <div className="auth-startup-copy">
          <span>CrossNotes</span>
          <strong>Preparing your study desk</strong>
          <small>Restoring your saved session</small>
        </div>
        <div className="auth-startup-dots" aria-hidden="true"><i /><i /><i /></div>
      </section>
    </main>
  );
}
