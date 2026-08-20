import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import {
  BookOpen,
  Coins,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  MessageSquareText,
  X,
  Bug,
  Lightbulb,
  HeartHandshake,
  Send,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSound } from '@/contexts/SoundContext';
import { useUserProfile } from '@/hooks/useFirestore';
import { submitFeedback, type FeedbackKind } from '@/lib/feedback';

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
  { id: 'idea', label: 'Share an idea', description: 'Tell us what would make studying better.', icon: Lightbulb },
  { id: 'bug', label: 'Report a bug', description: 'Help us fix something that feels off.', icon: Bug },
  { id: 'encouragement', label: 'Send some love', description: 'A quick note for the CrossNotes team.', icon: HeartHandshake },
];

export default function AppHeader({ title, backHref, backLabel }: AppHeaderProps) {
  const { user, signInWithGoogle, logout, isFirebaseReady } = useAuth();
  const { isDark, toggleDark } = useTheme();
  const { soundOn, toggleSound } = useSound();
  const { profile } = useUserProfile(user?.uid);
  const coins = profile?.coins ?? 0;
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackKind, setFeedbackKind] = useState<FeedbackKind>('idea');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleAvatar = () => {
    if (user) {
      if (window.confirm(`Signed in as ${user.displayName}.\n\nSign out?`)) logout();
    } else {
      signInWithGoogle();
    }
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
      toast.error('Add a little detail so we know how to help.');
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
    toast.success('Feedback received. Thank you for helping CrossNotes grow.');
  };

  return (
    <>
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
          <button onClick={openFeedback} className="feedback-launcher" aria-label="Send feedback" title="Send feedback">
            <MessageSquareText size={17} />
            <span className="hidden sm:inline">Feedback</span>
          </button>
          <button onClick={toggleSound} className="app-header-icon-btn" aria-label={soundOn ? 'Mute sound effects' : 'Unmute sound effects'} title={soundOn ? 'Sound on' : 'Sound off'}>
            {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button onClick={toggleDark} className="app-header-icon-btn" aria-label={isDark ? 'Light mode' : 'Dark mode'}>
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button onClick={handleAvatar} className="avatar-btn" title={user ? `${user.displayName} — tap to sign out` : 'Sign in with Google'}>
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

      {feedbackOpen && (
        <div className="feedback-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeFeedback()}>
          <section className="feedback-modal" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
            <button className="feedback-close" onClick={closeFeedback} aria-label="Close feedback dialog"><X size={19} /></button>
            {submitted ? (
              <div className="feedback-success">
                <div className="feedback-success-icon"><CheckCircle2 size={32} /></div>
                <span className="feedback-kicker"><Sparkles size={14} /> Message delivered</span>
                <h2 id="feedback-title">You made CrossNotes better.</h2>
                <p>Thanks for taking a moment to help us build a calmer, smarter study space.</p>
                <button className="clay-btn feedback-primary-action" onClick={closeFeedback}>Back to studying</button>
              </div>
            ) : (
              <>
                <div className="feedback-modal-heading">
                  <span className="feedback-kicker"><MessageSquareText size={14} /> Your voice shapes the app</span>
                  <h2 id="feedback-title">What should we improve?</h2>
                  <p>Pick a path, then share the thought in your own words. No forms to wrestle with.</p>
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
                  <span>Tell us a little more <em>·</em></span>
                  <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder={feedbackKind === 'bug' ? 'What happened, and what did you expect?' : 'What is on your mind?'} maxLength={600} autoFocus />
                  <small>{message.length}/600</small>
                </label>
                <div className="feedback-modal-footer">
                  <span className="feedback-privacy">Saved on this device · {user ? 'signed-in context included' : 'anonymous'}</span>
                  <button className="clay-btn" onClick={handleSubmitFeedback}><Send size={16} /> Send feedback</button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}
