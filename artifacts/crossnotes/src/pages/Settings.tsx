import { useEffect, useState } from 'react';
import { Accessibility, Bell, BookOpen, Check, Download, ExternalLink, MessageSquareText, Moon, Palette, Shield, Sparkles, Sun, Trash2, Volume2, VolumeX } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import { useTheme } from '@/contexts/ThemeContext';
import { useSound } from '@/contexts/SoundContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile, setLeaderboardVisibility } from '@/hooks/useFirestore';
import { useStudyReminders } from '@/hooks/useStudyReminders';
import { clearVaultFiles, listVaultFiles, removeVaultFile, type CachedVaultEntry } from '@/lib/offlineVault';
import { changelog, getUnseenChangelog, markChangelogSeen } from '@/lib/changelog';
import { getTypicalStudyWindow, readActivity } from '@/lib/activity';
import { useHead, useBreadcrumb } from '@/hooks/useSeo';
import { toast } from 'sonner';

export default function Settings() {
  const { user } = useAuth();
  const { isDark, toggleDark, blueLightProtection, toggleBlueLightProtection, reducedMotion, toggleReducedMotion } = useTheme();
  const { soundOn, toggleSound } = useSound();
  const { profile } = useUserProfile(user?.uid);
  const reminders = useStudyReminders();
  const [cached, setCached] = useState<CachedVaultEntry[]>([]);
  const [unseen, setUnseen] = useState(getUnseenChangelog);
  const [activity] = useState(readActivity);
  const [leaderboardHidden, setLeaderboardHidden] = useState(false);
  useHead({ title: 'Settings — CrossNotes', description: 'Personalise your CrossNotes study experience.' });
  useBreadcrumb([{ name: 'Home', url: '/' }, { name: 'Settings', url: '/settings' }]);

  useEffect(() => {
    if (profile) setLeaderboardHidden(profile.leaderboardOptOut ?? false);
  }, [profile]);

  const toggleLeaderboardVisibility = async () => {
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

  const refreshCache = () => listVaultFiles().then(setCached);
  useEffect(() => { refreshCache(); }, []);

  const openFeedback = () => window.dispatchEvent(new CustomEvent('crossnotes:open-feedback'));
  const clearOffline = async () => {
    if (!window.confirm('Remove all saved Vault files from this device?')) return;
    await clearVaultFiles();
    setCached([]);
    toast.success('Offline Vault cleared.');
  };
  const removeOffline = async (url: string) => {
    await removeVaultFile(url);
    setCached((current) => current.filter((entry) => entry.url !== url));
    toast.success('Removed from offline Vault.');
  };
  const showInstallGuide = () => window.dispatchEvent(new CustomEvent('crossnotes:open-install-guide'));
  const setReminder = async (enabled: boolean) => {
    const result = enabled ? await reminders.enable(reminders.time) : await reminders.disable();
    if (enabled && result !== 'granted') toast.error('Notifications were not enabled in this browser.');
  };

  return (
    <div className={`cn-body ${isDark ? 'dark-mode' : ''} app-page settings-page`}>
      <AppHeader title="Settings" backHref="/" backLabel="Home" />
      <main className="settings-content">
        {unseen.length > 0 && <section className="settings-return clay-card" aria-live="polite"><Sparkles size={20} /><div><strong>While you were away</strong><span>{unseen.length} new CrossNotes update{unseen.length === 1 ? '' : 's'}.</span></div><button className="settings-inline-btn" onClick={() => { setUnseen([]); markChangelogSeen(); }}>Mark read</button></section>}
        <section className="settings-hero"><span className="settings-kicker"><Sparkles size={15} /> Make the app fit your study rhythm</span><h1>Settings</h1><p>Small switches, fewer distractions, and a little more control over your offline study space.</p></section>
        <section className="settings-section" aria-labelledby="appearance-title"><h2 id="appearance-title"><Palette size={18} /> Appearance &amp; audio</h2><div className="settings-grid">
          <button className="settings-row" onClick={toggleDark}><span className="settings-row-icon">{isDark ? <Moon size={18} /> : <Sun size={18} />}</span><span><strong>{isDark ? 'Dark appearance' : 'Light appearance'}</strong><small>Use the mode that feels easiest on your eyes.</small></span><Check size={17} className="settings-check" /></button>
          <button className="settings-row" onClick={toggleBlueLightProtection}><span className="settings-row-icon"><Sun size={18} /></span><span><strong>Blue-light protection</strong><small>Warm the screen for evening revision.</small></span><span className={`settings-status ${blueLightProtection ? 'on' : ''}`}>{blueLightProtection ? 'On' : 'Off'}</span></button>
          <button className="settings-row" onClick={toggleSound}><span className="settings-row-icon">{soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}</span><span><strong>Sound effects</strong><small>Keep feedback sounds on while you study.</small></span><span className={`settings-status ${soundOn ? 'on' : ''}`}>{soundOn ? 'On' : 'Off'}</span></button>
          <button className="settings-row" onClick={toggleReducedMotion}><span className="settings-row-icon"><Accessibility size={18} /></span><span><strong>Reduced motion</strong><small>Minimise animations while moving through the app.</small></span><span className={`settings-status ${reducedMotion ? 'on' : ''}`}>{reducedMotion ? 'On' : 'Off'}</span></button>
        </div></section>
        <section className="settings-section" aria-labelledby="reminders-title"><h2 id="reminders-title"><Bell size={18} /> Study reminders</h2><div className="settings-card clay-card"><div><strong>Daily nudge</strong><p>{reminders.supported ? 'A gentle browser notification keeps your chosen study time visible.' : 'This browser does not support notifications.'}</p></div><label className="settings-switch"><input type="checkbox" checked={reminders.enabled} onChange={(e) => setReminder(e.target.checked)} disabled={!reminders.supported} /><span /></label><input className="settings-time" type="time" value={reminders.time} onChange={(e) => reminders.updateTime(e.target.value)} disabled={!reminders.enabled} aria-label="Reminder time" /></div></section>
        {user && <section className="settings-section" aria-labelledby="privacy-title"><h2 id="privacy-title"><Shield size={18} /> Privacy</h2><button className="settings-row" onClick={toggleLeaderboardVisibility}><span className="settings-row-icon"><Shield size={18} /></span><span><strong>Leaderboard visibility</strong><small>{leaderboardHidden ? 'Your XP is hidden from other learners.' : 'Your XP appears on the leaderboard.'}</small></span><span className={`settings-status ${leaderboardHidden ? 'on' : ''}`}>{leaderboardHidden ? 'Hidden' : 'Visible'}</span></button></section>}
        <section className="settings-section" aria-labelledby="personal-title"><h2 id="personal-title"><BookOpen size={18} /> Usage-time personalization</h2><div className="settings-card clay-card"><div><strong>Your local study rhythm</strong><p>{getTypicalStudyWindow(activity) ? `You usually visit around ${getTypicalStudyWindow(activity)}. This is an approximate CrossNotes-only estimate.` : 'We are still learning your rhythm — come back a few times and we will estimate it.'}</p></div><div className="settings-stat"><b>{activity.visits}</b><span>visits</span></div><div className="settings-stat"><b>{activity.minutes}</b><span>minutes</span></div></div></section>
        <section className="settings-section" aria-labelledby="offline-title"><h2 id="offline-title"><Shield size={18} /> Offline Vault</h2><div className="settings-card clay-card"><div><strong>{cached.length ? `${cached.length} saved resource${cached.length === 1 ? '' : 's'}` : 'No saved resources'}</strong><p>Saved files stay on this device and work without internet. Add more from any Vault resource.</p></div><button className="settings-danger-btn" onClick={clearOffline} disabled={!cached.length}><Trash2 size={15} /> Clear all</button></div>{cached.length > 0 && <div className="settings-offline-list">{cached.map((entry) => <div className="settings-offline-item" key={entry.url}><span title={entry.url}>{entry.url.split('/').pop() ?? entry.url}</span><button className="settings-danger-btn" onClick={() => removeOffline(entry.url)} aria-label={`Remove ${entry.url} from offline storage`}><Trash2 size={14} /></button></div>)}</div>}</section>
        <section className="settings-section" aria-labelledby="help-title"><h2 id="help-title"><Download size={18} /> Install &amp; help</h2><div className="settings-actions clay-card"><button onClick={showInstallGuide}><Download size={16} /> Add CrossNotes to this device</button><button onClick={openFeedback}><MessageSquareText size={16} /> Send feedback <ExternalLink size={13} /></button></div></section>
        <section className="settings-section" aria-labelledby="changes-title"><h2 id="changes-title"><Sparkles size={18} /> Changelog</h2><div className="settings-changelog">{changelog.map((entry) => <article className="settings-change clay-card" key={entry.date}><time dateTime={entry.date}>{entry.date}</time><div><strong>{entry.title}</strong><p>{entry.copy}</p></div></article>)}</div></section>
      </main>
    </div>
  );
}
