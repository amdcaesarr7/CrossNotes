import { useState, type ReactNode } from 'react';
import { Bell, BellOff, Cookie, Eye, EyeOff, LogOut, Moon, ShieldCheck, Sun, SunMedium, Volume2, Accessibility } from 'lucide-react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import AppHeader from '@/components/AppHeader';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { useSound } from '@/contexts/SoundContext';
import { useTheme } from '@/contexts/ThemeContext';
import { setLeaderboardVisibility, useUserProfile } from '@/hooks/useFirestore';
import { getReminderPreference, isNotificationSupported, requestReminderPermission, setReminderPreference } from '@/lib/notifications';
import { openCookiePreferences } from '@/lib/cookies';
import '../crossnotes.css';

function SettingRow({ icon: Icon, title, description, children }: {
  icon: typeof Moon;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="settings-row">
      <span className="settings-row-icon"><Icon size={18} /></span>
      <div className="settings-row-copy">
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button type="button" className={`settings-toggle${checked ? ' is-on' : ''}`} onClick={onChange} aria-pressed={checked} aria-label={label}>
      <span />
    </button>
  );
}

export default function Settings() {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const { isDark, toggleDark, blueLightProtection, toggleBlueLightProtection, reducedMotion, toggleReducedMotion } = useTheme();
  const { soundOn, toggleSound } = useSound();
  const { profile } = useUserProfile(user?.uid);
  const [leaderboardHidden, setLeaderboardHidden] = useState(profile?.leaderboardOptOut ?? false);
  const [notificationsOn, setNotificationsOn] = useState(getReminderPreference());
  const notificationsSupported = isNotificationSupported();

  const updateLeaderboard = async () => {
    if (!user) return;
    const next = !leaderboardHidden;
    try {
      await setLeaderboardVisibility(user.uid, next);
      setLeaderboardHidden(next);
      toast.success(next ? 'Your XP is hidden from the leaderboard.' : 'Your XP is visible on the leaderboard again.');
    } catch (error) {
      console.error('[Settings] Failed to update leaderboard visibility:', error);
      toast.error('Could not update leaderboard visibility. Please try again.');
    }
  };

  const updateNotifications = async () => {
    if (notificationsOn) {
      setReminderPreference(false);
      setNotificationsOn(false);
      return;
    }
    const granted = await requestReminderPermission();
    setNotificationsOn(granted);
    if (!granted) toast.error('Browser notifications were not enabled.');
  };

  const signOut = () => {
    if (user && window.confirm(`Signed in as ${user.displayName}.\n\nSign out?`)) {
      logout();
      navigate('/');
    }
  };

  return (
    <div className={`cn-body ${isDark ? 'dark-mode' : ''}`}>
      <AppHeader title="Settings" backHref="/" backLabel="Home" />
      <main className="page-content settings-page">
        <section className="clay-card settings-hero">
          <div className="settings-hero-icon"><ShieldCheck size={24} /></div>
          <div>
            <h1 className="font-display font-black text-xl" style={{ color: 'var(--text)' }}>Your study space</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Tune CrossNotes to feel calmer, clearer, and easier to use.</p>
          </div>
        </section>

        <section>
          <h2 className="section-header mb-3">Appearance & accessibility</h2>
          <div className="clay-card settings-card">
            <SettingRow icon={isDark ? Moon : Sun} title="Appearance" description={isDark ? 'Dark mode is on' : 'Light mode is on'}>
              <Toggle checked={isDark} onChange={toggleDark} label="Toggle dark mode" />
            </SettingRow>
            <SettingRow icon={Volume2} title="Sound effects" description={soundOn ? 'Study feedback sounds are on' : 'Study feedback sounds are off'}>
              <Toggle checked={soundOn} onChange={toggleSound} label="Toggle sound effects" />
            </SettingRow>
            <SettingRow icon={SunMedium} title="Blue light protection" description={blueLightProtection ? 'A warmer reading tint is on' : 'Use the normal screen colours'}>
              <Toggle checked={blueLightProtection} onChange={toggleBlueLightProtection} label="Toggle blue light protection" />
            </SettingRow>
            <SettingRow icon={Accessibility} title="Reduced motion" description={reducedMotion ? 'Animations are minimized' : 'Use normal page animations'}>
              <Toggle checked={reducedMotion} onChange={toggleReducedMotion} label="Toggle reduced motion" />
            </SettingRow>
          </div>
        </section>

        <section>
          <h2 className="section-header mb-3">Privacy & reminders</h2>
          <div className="clay-card settings-card">
            {user && (
              <SettingRow icon={leaderboardHidden ? Eye : EyeOff} title="Leaderboard visibility" description={leaderboardHidden ? 'Your XP is hidden from other learners' : 'Your XP appears on the leaderboard'}>
                <Toggle checked={!leaderboardHidden} onChange={updateLeaderboard} label="Toggle leaderboard visibility" />
              </SettingRow>
            )}
            {notificationsSupported && (
              <SettingRow icon={notificationsOn ? Bell : BellOff} title="Study reminders" description={notificationsOn ? 'Mew can send evening streak nudges' : 'No browser study reminders'}>
                <Toggle checked={notificationsOn} onChange={updateNotifications} label="Toggle study reminders" />
              </SettingRow>
            )}
            <button className="settings-action" onClick={openCookiePreferences}><Cookie size={18} /> <span>Cookie preferences</span></button>
          </div>
        </section>

        {user && (
          <button className="settings-signout" onClick={signOut}>
            <LogOut size={18} /> Sign out of CrossNotes
          </button>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
