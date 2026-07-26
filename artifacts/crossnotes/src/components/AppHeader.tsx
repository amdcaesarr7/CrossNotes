import { BookOpen, Moon, Sun, Volume2, VolumeX, Coins } from 'lucide-react';
import { Link } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSound } from '@/contexts/SoundContext';
import { useUserProfile } from '@/hooks/useFirestore';

interface AppHeaderProps {
  title?: string;
  backHref?: string;
  backLabel?: string;
}

export default function AppHeader({ title, backHref, backLabel }: AppHeaderProps) {
  const { user, signInWithGoogle, logout, isFirebaseReady } = useAuth();
  const { isDark, toggleDark } = useTheme();
  const { soundOn, toggleSound } = useSound();
  const { profile } = useUserProfile(user?.uid);
  const coins = profile?.coins ?? 0;

  const handleAvatar = () => {
    if (user) {
      if (window.confirm(`Signed in as ${user.displayName}.\n\nSign out?`)) logout();
    } else {
      signInWithGoogle();
    }
  };

  return (
    <header className="app-header">
      <div className="flex items-center gap-2 min-w-0">
        {backHref ? (
          <Link href={backHref}>
            <button className="app-header-back" aria-label="Back">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              {backLabel && <span>{backLabel}</span>}
            </button>
          </Link>
        ) : (
          <Link href="/">
            <div className="flex items-center gap-2">
              <BookOpen size={22} style={{ color: 'var(--primary)' }} />
              <span className="font-display font-bold text-lg hidden sm:inline" style={{ color: 'var(--primary)' }}>CrossNotes</span>
            </div>
          </Link>
        )}
        {title && <h1 className="app-header-title truncate">{title}</h1>}
      </div>

      <div className="flex items-center gap-2">
        {!isFirebaseReady && (
          <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-full border border-amber-300 hidden sm:inline">
            ⚠ Firebase
          </span>
        )}
        {user && (
          <Link href="/shop">
            <button className="app-header-coins" title={`${coins} coins — visit the Shop`}>
              <Coins size={14} style={{ color: 'var(--gold)' }} />
              <span>{coins}</span>
            </button>
          </Link>
        )}
        <button
          onClick={toggleSound}
          className="app-header-icon-btn"
          aria-label={soundOn ? 'Mute sound effects' : 'Unmute sound effects'}
          title={soundOn ? 'Sound on' : 'Sound off'}
        >
          {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
        <button
          onClick={toggleDark}
          className="app-header-icon-btn"
          aria-label={isDark ? 'Light mode' : 'Dark mode'}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button
          onClick={handleAvatar}
          className="avatar-btn"
          title={user ? `${user.displayName} — tap to sign out` : 'Sign in with Google'}
        >
          {user?.photoURL ? (
            <img src={user.photoURL} alt={user.displayName ?? ''} className="w-full h-full object-cover" />
          ) : user ? (
            <span className="avatar-initial">{user.displayName?.charAt(0) ?? '?'}</span>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3H19a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H15" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
