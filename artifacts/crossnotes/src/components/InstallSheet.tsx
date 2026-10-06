import { useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { dismissInstallPrompt } from '@/lib/installPrompt';
import { VOICE } from '@/lib/voice';
import InstallPanel from '@/components/InstallPanel';

interface InstallSheetProps {
  open: boolean;
  onClose: () => void;
  /** Soft prompt after study vs user-opened from Settings-style contexts. */
  mode?: 'soft' | 'manual';
}

/**
 * Bottom-sheet install experience — platform-correct CTA + illustrated fallback steps.
 */
export default function InstallSheet({ open, onClose, mode = 'soft' }: InstallSheetProps) {
  const { isDark } = useTheme();
  const { installed, canInstall, install } = useInstallPrompt();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (mode === 'soft') dismissInstallPrompt();
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, mode, onClose]);

  if (!open || installed) return null;

  const handleDismiss = () => {
    if (mode === 'soft') dismissInstallPrompt();
    onClose();
  };

  const handlePrimary = async () => {
    if (!canInstall) return;
    const accepted = await install();
    if (accepted) onClose();
  };

  return (
    <div
      className={`install-sheet-overlay ${isDark ? 'dark-mode' : ''}`}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleDismiss();
      }}
    >
      <section
        className="install-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-sheet-title"
        aria-describedby="install-sheet-body"
      >
        <button type="button" className="install-sheet-close" onClick={handleDismiss} aria-label="Close install prompt">
          <X size={18} />
        </button>

        <span className="install-sheet-kicker"><Download size={14} aria-hidden="true" /> {VOICE.softInstallKicker}</span>
        <h2 id="install-sheet-title">{VOICE.softInstallTitle}</h2>
        <p id="install-sheet-body">{VOICE.softInstallBody}</p>

        <InstallPanel variant="soft" onInstalled={onClose} />

        <div className="install-sheet-actions">
          <button type="button" className="install-sheet-secondary" onClick={handleDismiss}>
            {VOICE.softInstallSecondary}
          </button>
          {canInstall ? (
            <button type="button" className="clay-btn install-sheet-primary" onClick={() => { void handlePrimary(); }}>
              <Download size={16} /> {VOICE.softInstallPrimary}
            </button>
          ) : (
            <button type="button" className="clay-btn install-sheet-primary" onClick={handleDismiss}>
              Got it
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
