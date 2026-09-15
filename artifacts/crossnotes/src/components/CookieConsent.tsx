import { useEffect, useState } from 'react';
import { Cookie, Settings2, ShieldCheck, X } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import {
  onCookiePreferencesRequest,
  readCookieConsent,
  saveCookieConsent,
} from '@/lib/cookies';

export default function CookieConsent() {
  const { isDark } = useTheme();
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [preferences, setPreferences] = useState(true);

  useEffect(() => {
    setVisible(readCookieConsent() === null);
    return onCookiePreferencesRequest(() => {
      const current = readCookieConsent();
      setPreferences(current?.preferences ?? true);
      setCustomizing(true);
      setVisible(true);
    });
  }, []);

  if (!visible) return null;

  const choose = (allowPreferences: boolean) => {
    saveCookieConsent(allowPreferences);
    setVisible(false);
    setCustomizing(false);
  };

  return (
    <aside className={`cookie-consent ${isDark ? 'dark-mode' : ''}`} aria-label="Cookie preferences">
      <div className="cookie-consent-icon"><Cookie size={20} aria-hidden="true" /></div>
      <div className="cookie-consent-copy">
        <div className="cookie-consent-heading">
          <strong>Cookies, kept simple</strong>
          <button type="button" className="cookie-consent-close" onClick={() => choose(false)} aria-label="Use essential cookies only">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <p>CrossNotes uses a necessary cookie to remember this choice. Optional preference cookies help us remember your experience.</p>
        {customizing && (
          <label className="cookie-consent-option">
            <input type="checkbox" checked={preferences} onChange={(event) => setPreferences(event.target.checked)} />
            <span><strong>Preference cookies</strong><small>Remember non-essential app preferences on this device.</small></span>
          </label>
        )}
        <div className="cookie-consent-actions">
          <button type="button" className="cookie-consent-secondary" onClick={() => setCustomizing((open) => !open)}>
            <Settings2 size={15} aria-hidden="true" /> {customizing ? 'Hide options' : 'Customize'}
          </button>
          {customizing ? (
            <button type="button" className="cookie-consent-primary" onClick={() => choose(preferences)}>Save choices</button>
          ) : (
            <>
              <button type="button" className="cookie-consent-secondary" onClick={() => choose(false)}>Essential only</button>
              <button type="button" className="cookie-consent-primary" onClick={() => choose(true)}>Accept all</button>
            </>
          )}
        </div>
        <span className="cookie-consent-note"><ShieldCheck size={13} aria-hidden="true" /> You can change this anytime from Settings.</span>
      </div>
    </aside>
  );
}
