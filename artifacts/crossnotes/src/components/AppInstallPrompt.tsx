import { useEffect, useState } from 'react';
import { Download, MoreHorizontal, PlusSquare, Share2, X } from 'lucide-react';
import MewMascot from '@/components/MewMascot';
import { useTheme } from '@/contexts/ThemeContext';

const DISMISS_KEY = 'cn-install-prompt-dismissed';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

function isStandaloneDisplay() {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || navigatorWithStandalone.standalone === true;
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function readDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === 'true';
  } catch {
    return false;
  }
}

export default function AppInstallPrompt() {
  const { isDark } = useTheme();
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [installed, setInstalled] = useState(false);
  const ios = typeof navigator !== 'undefined' && isIos();

  useEffect(() => {
    if (isStandaloneDisplay()) {
      setInstalled(true);
      return;
    }

    if (!readDismissed()) setVisible(true);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as InstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setVisible(false);
      setGuideOpen(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  useEffect(() => {
    if (!guideOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setGuideOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [guideOpen]);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, 'true');
    } catch {
      /* non-essential persistence */
    }
    setVisible(false);
    setGuideOpen(false);
  };

  const install = async () => {
    if (!deferredPrompt) {
      setGuideOpen(true);
      return;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setVisible(false);
      setGuideOpen(false);
    }
    setDeferredPrompt(null);
  };

  if (installed || !visible) return null;

  return (
    <>
      <aside className={`install-prompt ${isDark ? 'mew-theme-dark' : ''}`} role="region" aria-label="Add CrossNotes to your device">
        <MewMascot size="sm" mood="cheery" className="install-prompt__mew" />
        <div className="install-prompt__copy">
          <strong>Keep CrossNotes one tap away.</strong>
          <span>Add it as an app or a home-screen shortcut. Mew approves of fewer excuses.</span>
        </div>
        <button className="install-prompt__action" onClick={install}>
          <Download size={15} /> {deferredPrompt ? 'Install' : 'Add'}
        </button>
        <button className="install-prompt__dismiss" onClick={dismiss} aria-label="Dismiss install prompt"><X size={15} /></button>
      </aside>

      {guideOpen && (
        <div className={`install-guide-overlay ${isDark ? 'mew-theme-dark' : ''}`} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setGuideOpen(false)}>
          <section className="install-guide" role="dialog" aria-modal="true" aria-labelledby="install-guide-title">
            <button className="install-guide__close" onClick={() => setGuideOpen(false)} aria-label="Close add-to-device instructions"><X size={18} /></button>
            <MewMascot size="md" mood="cheery" />
            <span className="install-guide__eyebrow">Make it feel like yours</span>
            <h2 id="install-guide-title">Add CrossNotes to your device</h2>
            {ios ? (
              <p>In Safari, tap <Share2 size={15} aria-label="Share" /> <strong>Share</strong>, then choose <strong>Add to Home Screen</strong>. It will sit alongside your usual apps.</p>
            ) : (
              <p>Use your browser menu and choose <strong>Install app</strong>, <strong>Add to Home screen</strong>, or <strong>Create shortcut</strong>. The wording changes by browser, because apparently consistency was too much to ask.</p>
            )}
            <div className="install-guide__steps" aria-label="Install instructions">
              <div><MoreHorizontal size={17} /><span>Open your browser menu</span></div>
              <div>{ios ? <Share2 size={17} /> : <Download size={17} />}<span>{ios ? 'Tap Share' : 'Choose Install or Create shortcut'}</span></div>
              <div><PlusSquare size={17} /><span>Add CrossNotes to your home screen</span></div>
            </div>
            <button className="clay-btn install-guide__done" onClick={dismiss}>Got it</button>
          </section>
        </div>
      )}
    </>
  );
}
