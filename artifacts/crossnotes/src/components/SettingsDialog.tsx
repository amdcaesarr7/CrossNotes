import { useEffect } from 'react';
import {
  MessageSquareText,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useSound } from '@/contexts/SoundContext';
import { VOICE } from '@/lib/voice';
import InstallPanel from '@/components/InstallPanel';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  /** Optional — opens the feedback flow (used for guests without an account menu). */
  onFeedback?: () => void;
}

export default function SettingsDialog({ open, onClose, onFeedback }: SettingsDialogProps) {
  const { isDark, toggleDark } = useTheme();
  const { soundOn, toggleSound } = useSound();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="settings-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <button className="settings-close" onClick={onClose} aria-label="Close settings"><X size={18} /></button>

        <span className="settings-kicker">{VOICE.settingsKicker}</span>
        <h2 id="settings-title">{VOICE.settingsTitle}</h2>

        <div className="settings-section" aria-label="Appearance and sound">
          <h3>{VOICE.settingsAppearance}</h3>
          <button className="settings-row" onClick={toggleDark} aria-pressed={isDark}>
            <span className="settings-row-icon" aria-hidden="true">{isDark ? <Sun size={17} /> : <Moon size={17} />}</span>
            <span className="settings-row-copy">
              <strong>{isDark ? VOICE.themeLightTitle : VOICE.themeDarkTitle}</strong>
              <small>{isDark ? VOICE.themeLightHint : VOICE.themeDarkHint}</small>
            </span>
            <span className={`settings-toggle ${isDark ? 'on' : ''}`} aria-hidden="true"><span /></span>
          </button>

          <button className="settings-row" onClick={toggleSound} aria-pressed={soundOn}>
            <span className="settings-row-icon" aria-hidden="true">{soundOn ? <Volume2 size={17} /> : <VolumeX size={17} />}</span>
            <span className="settings-row-copy">
              <strong>{soundOn ? VOICE.soundOnTitle : VOICE.soundOffTitle}</strong>
              <small>{soundOn ? VOICE.soundOnHint : VOICE.soundOffHint}</small>
            </span>
            <span className={`settings-toggle ${soundOn ? 'on' : ''}`} aria-hidden="true"><span /></span>
          </button>
        </div>

        <div className="settings-section" aria-label="Install CrossNotes">
          <h3>{VOICE.settingsInstall}</h3>
          <InstallPanel variant="settings" />
        </div>

        {onFeedback && (
          <div className="settings-section" aria-label="Feedback">
            <h3>Feedback</h3>
            <button
              className="settings-row"
              onClick={() => {
                onClose();
                onFeedback();
              }}
            >
              <span className="settings-row-icon" aria-hidden="true"><MessageSquareText size={17} /></span>
              <span className="settings-row-copy">
                <strong>{VOICE.feedbackMenu}</strong>
                <small>{VOICE.feedbackLead}</small>
              </span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
