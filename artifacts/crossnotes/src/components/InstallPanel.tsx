import { useState } from 'react';
import {
  CheckCircle2,
  Download,
  MoreHorizontal,
  PlusSquare,
  Smartphone,
  WifiOff,
  Zap,
} from 'lucide-react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { VOICE } from '@/lib/voice';

interface InstallPanelProps {
  /** Larger soft-prompt layout vs compact Settings block. */
  variant?: 'settings' | 'soft';
  onInstalled?: () => void;
}

/**
 * Shared install body — Settings + soft sheet both render this so copy/steps stay one source.
 */
export default function InstallPanel({ variant = 'settings', onInstalled }: InstallPanelProps) {
  const { installed, canInstall, install, ios } = useInstallPrompt();
  const soft = variant === 'soft';
  const [showManualSteps, setShowManualSteps] = useState(false);

  const handleInstall = async () => {
    const ok = await install();
    if (ok) onInstalled?.();
    else setShowManualSteps(true);
  };

  if (installed) {
    return (
      <div className="settings-installed">
        <span className="settings-installed-icon" aria-hidden="true"><CheckCircle2 size={20} /></span>
        <span className="settings-row-copy">
          <strong>{VOICE.installedTitle}</strong>
          <small>{VOICE.installedHint}</small>
        </span>
      </div>
    );
  }

  return (
    <div className={`install-panel${soft ? ' install-panel-soft' : ''}`}>
      {soft && (
        <ul className="install-benefits" aria-label="Why install">
          <li><Zap size={15} aria-hidden="true" /><span>{VOICE.installBenefitsFast}</span></li>
          <li><WifiOff size={15} aria-hidden="true" /><span>{VOICE.installBenefitsOffline}</span></li>
          <li><Smartphone size={15} aria-hidden="true" /><span>{VOICE.installBenefitsFullscreen}</span></li>
        </ul>
      )}

      {!soft && (
        <div className="settings-install-cta">
          <span className="settings-row-copy">
            <strong>{VOICE.installTitle}</strong>
            <small>{VOICE.installHint}</small>
          </span>
          <button
            type="button"
            className="clay-btn settings-install-btn"
            onClick={() => {
              if (canInstall) void handleInstall();
              else setShowManualSteps((show) => !show);
            }}
            aria-expanded={!canInstall && showManualSteps}
          >
            <Download size={15} /> {canInstall ? VOICE.installBtn : showManualSteps ? VOICE.hideInstallFallback : VOICE.showInstallFallback}
          </button>
        </div>
      )}

      {soft && canInstall && (
        <p className="settings-guide-copy" style={{ marginTop: 0 }}>
          {VOICE.installHint}
        </p>
      )}

      {(soft ? !canInstall : showManualSteps) && (
        <>
          <p className="settings-guide-copy">
            {ios ? VOICE.softInstallIosHint : VOICE.installGuide}
          </p>
          {!ios && (
            <div className="settings-guide-steps" aria-label="Install instructions">
              <div><MoreHorizontal size={15} /><span>{VOICE.installStep1}</span></div>
              <div><Download size={15} /><span>{VOICE.installStep2Other}</span></div>
              <div><PlusSquare size={15} /><span>{VOICE.installStep3}</span></div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
