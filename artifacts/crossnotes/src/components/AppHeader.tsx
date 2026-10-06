/** Account + Settings entry — prefs live in Settings, not header quick toggles. */
import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import {
  BookOpen,
  Coins,
  MessageSquareText,
  X,
  Bug,
  Lightbulb,
  HeartHandshake,
  Send,
  CheckCircle2,
  Sparkles,
  BarChart3,
  BadgeInfo,
  Settings2,
  LogOut,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useUserProfile } from '@/hooks/useFirestore';
import { submitFeedback, type FeedbackKind } from '@/lib/feedback';
import { googleAvatarUrl } from '@/lib/utils';
import { VOICE } from '@/lib/voice';
import SettingsDialog from '@/components/SettingsDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AppHeaderProps {
  title?: string;
  backHref?: string;
  backLabel?: string;
}

const feedbackKinds: Array<{
  id: FeedbackKind;
  label: string;
  description: string;
  icon: typeof Lightbulb;
}> = [
  { id: 'idea', label: 'Idea dump', description: 'What would make grinding less painful?', icon: Lightbulb },
  { id: 'bug', label: 'Bug report', description: 'Something broke. Roast it constructively.', icon: Bug },
  { id: 'encouragement', label: 'Send love', description: 'Rare. Appreciated. We screenshot these.', icon: HeartHandshake },
];

export default function AppHeader({ title, backHref, backLabel }: AppHeaderProps) {
  const { user, signInWithGoogle, logout, isFirebaseReady } = useAuth();
  const { isDark } = useTheme();
  const { profile } = useUserProfile(user?.uid);
  const coins = profile?.coins ?? 0;
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackKind, setFeedbackKind] = useState<FeedbackKind>('idea');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleSignOut = () => {
    if (user && window.confirm(`Signed in as ${user.displayName}.\n\nSign out?`)) logout();
  };

  useEffect(() => {
    if (!feedbackOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFeedbackOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [feedbackOpen]);

  const openFeedback = () => {
    setSubmitted(false);
    setFeedbackOpen(true);
  };

  const closeFeedback = () => setFeedbackOpen(false);

  const handleSubmitFeedback = async () => {
    const cleanedMessage = message.trim();
    if (!cleanedMessage) {
      toast.error('Type something — psychic mode is still in beta.');
      return;
    }

    await submitFeedback({
      kind: feedbackKind,
      message: cleanedMessage,
      userId: user?.uid,
      userName: user?.displayName,
    });
    setSubmitted(true);
    setMessage('');
    toast.success('Got it. Chaos documented.');
  };

  return (
    <>
      <header className="app-header">
        <div className="flex items-center gap-2 min-w-0">
          {backHref ? (
            <Link href={backHref} className="app-header-back" aria-label={backLabel ? `Back to ${backLabel}` : 'Go back'}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              {backLabel && <span>{backLabel}</span>}
            </Link>
          ) : (
            <Link href="/" aria-label="CrossNotes — go to dashboard">
              <div className="flex items-center gap-2">
                <BookOpen size={22} style={{ color: 'var(--primary)' }} aria-hidden="true" />
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
            <Link href="/shop" aria-label={`${coins} coins — visit the Shop`}>
              <div className="app-header-coins">
                <Coins size={14} style={{ color: 'var(--gold)' }} aria-hidden="true" />
                <span aria-hidden="true">{coins}</span>
              </div>
            </Link>
          )}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="avatar-btn" aria-label={`Open ${user.displayName ?? 'account'} menu`} title="Open account menu">
                  {user.photoURL ? (
                    <img src={googleAvatarUrl(user.photoURL, 44)} alt={user.displayName ?? 'User avatar'} className="w-full h-full object-cover" loading="lazy" decoding="async" width={44} height={44} />
                  ) : (
                    <span className="avatar-initial" aria-hidden="true">{user.displayName?.charAt(0) ?? '?'}</span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="end" sideOffset={10} className={`account-menu${isDark ? ' dark-mode' : ''}`}>
                <DropdownMenuLabel className="account-menu-label">
                  <span className="account-menu-name">{user.displayName ?? 'Scholar'}</span>
                  <span className="account-menu-email">{user.email ?? 'Your CrossNotes account'}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="account-menu-item account-progress-item">
                  <Link href="/progress"><BarChart3 size={17} aria-hidden="true" /> <span>{VOICE.accountProgress}</span></Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="account-menu-item">
                  <Link href="/credits"><BadgeInfo size={17} aria-hidden="true" /> <span>{VOICE.accountCredits}</span></Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="account-menu-item account-settings-item" onSelect={() => setSettingsOpen(true)}>
                  <Settings2 size={17} aria-hidden="true" /> <span>{VOICE.accountSettings}</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="account-menu-item account-settings-item" onSelect={() => openFeedback()}>
                  <MessageSquareText size={17} aria-hidden="true" /> <span>{VOICE.feedbackMenu}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="account-menu-item account-signout-item" onSelect={handleSignOut}>
                  <LogOut size={17} aria-hidden="true" /> <span>{VOICE.accountSignOut}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <button
                onClick={() => setSettingsOpen(true)}
                className="app-header-icon-btn"
                aria-label="Open settings"
                title="Settings"
              >
                <Settings2 size={18} aria-hidden="true" />
              </button>
              <button onClick={signInWithGoogle} className="avatar-btn" title="Sign in with Google" aria-label="Sign in with Google">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M15 3H19a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H15" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
                </svg>
              </button>
            </>
          )}
        </div>
      </header>

      {feedbackOpen && (
        <div className="feedback-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeFeedback()}>
          <section className="feedback-modal" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
            <button className="feedback-close" onClick={closeFeedback} aria-label="Close feedback dialog"><X size={19} /></button>
            {submitted ? (
              <div className="feedback-success">
                <div className="feedback-success-icon"><CheckCircle2 size={32} /></div>
                <span className="feedback-kicker"><Sparkles size={14} /> Delivered</span>
                <h2 id="feedback-title">{VOICE.feedbackSuccessTitle}</h2>
                <p>{VOICE.feedbackSuccessBody}</p>
                <button className="clay-btn feedback-primary-action" onClick={closeFeedback}>{VOICE.feedbackBack}</button>
              </div>
            ) : (
              <>
                <div className="feedback-modal-heading">
                  <span className="feedback-kicker"><MessageSquareText size={14} /> {VOICE.feedbackMenu}</span>
                  <h2 id="feedback-title">{VOICE.feedbackTitle}</h2>
                  <p>{VOICE.feedbackLead}</p>
                </div>
                <div className="feedback-kind-grid">
                  {feedbackKinds.map(({ id, label, description, icon: Icon }) => (
                    <button key={id} className={`feedback-kind ${feedbackKind === id ? 'selected' : ''}`} onClick={() => setFeedbackKind(id)} aria-pressed={feedbackKind === id}>
                      <span className="feedback-kind-icon"><Icon size={18} /></span>
                      <span className="feedback-kind-copy"><strong>{label}</strong><small>{description}</small></span>
                    </button>
                  ))}
                </div>
                <label className="feedback-field">
                  <span>Details <em>·</em></span>
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder={feedbackKind === 'bug' ? 'What broke, and what did you expect?' : 'What’s on your mind?'}
                    maxLength={600}
                    autoFocus
                  />
                  <small>{message.length}/600</small>
                </label>
                <div className="feedback-modal-footer">
                  <span className="feedback-privacy">Saved here · {user ? 'signed-in context included' : 'anonymous'}</span>
                  <button className="clay-btn" onClick={handleSubmitFeedback}><Send size={16} /> {VOICE.feedbackSend}</button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onFeedback={user ? undefined : () => { setSettingsOpen(false); openFeedback(); }}
      />
    </>
  );
}
