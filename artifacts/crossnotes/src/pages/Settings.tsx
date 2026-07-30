import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Moon, Sun, Volume2, VolumeX, Trash2, Save } from 'lucide-react';
import { Link } from 'wouter';
import { useTheme } from '@/contexts/ThemeContext';
import { useSound } from '@/contexts/SoundContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMotion } from '@/hooks/useMotion';
import AppHeader from '@/components/AppHeader';
import '../crossnotes.css';

interface SettingsState {
  darkMode: boolean;
  soundEnabled: boolean;
  reducedMotion: boolean;
  animationsEnabled: boolean;
  clearDataConfirm: boolean;
}

export default function Settings() {
  const { isDark, toggleDark, prefersReducedMotion } = useTheme();
  const { soundOn, toggleSound } = useSound();
  const { user } = useAuth();
  const { getVariants } = useMotion();

  const [settings, setSettings] = useState<SettingsState>(() => {
    try {
      const saved = localStorage.getItem('cn-user-settings');
      return saved
        ? JSON.parse(saved)
        : {
            darkMode: isDark,
            soundEnabled: soundOn,
            reducedMotion: prefersReducedMotion,
            animationsEnabled: !prefersReducedMotion,
            clearDataConfirm: false,
          };
    } catch {
      return {
        darkMode: isDark,
        soundEnabled: soundOn,
        reducedMotion: prefersReducedMotion,
        animationsEnabled: !prefersReducedMotion,
        clearDataConfirm: false,
      };
    }
  });

  const [saved, setSaved] = useState(false);

  // Save settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cn-user-settings', JSON.stringify(settings));
      setSaved(true);
      const timeout = setTimeout(() => setSaved(false), 2000);
      return () => clearTimeout(timeout);
    } catch {
      // Silently fail if localStorage unavailable
    }
  }, [settings]);

  const handleToggle = (key: keyof SettingsState) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleDarkModeChange = () => {
    toggleDark();
    setSettings((prev) => ({ ...prev, darkMode: !prev.darkMode }));
  };

  const handleSoundChange = () => {
    toggleSound();
    setSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  };

  const handleClearData = () => {
    if (!settings.clearDataConfirm) {
      setSettings((prev) => ({ ...prev, clearDataConfirm: true }));
      return;
    }

    // Clear all local data
    try {
      localStorage.clear();
      setSettings({
        darkMode: isDark,
        soundEnabled: soundOn,
        reducedMotion: prefersReducedMotion,
        animationsEnabled: !prefersReducedMotion,
        clearDataConfirm: false,
      });
      alert('All local data cleared. Page will refresh.');
      window.location.reload();
    } catch {
      alert('Failed to clear data');
    }
  };

  return (
    <div className="cn-body" style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <AppHeader title="Settings" backHref="/" backLabel="Back" />

      <main className="pt-20 pb-24 px-4 max-w-2xl mx-auto">
        <motion.div
          className="flex flex-col gap-4"
          initial={!prefersReducedMotion ? { opacity: 0 } : {}}
          animate={!prefersReducedMotion ? { opacity: 1 } : {}}
          transition={!prefersReducedMotion ? { staggerChildren: 0.08 } : {}}
        >
          {/* Appearance Section */}
          <motion.section
            className="clay-card p-6 flex flex-col gap-4"
            initial={!prefersReducedMotion ? { opacity: 0, y: 12 } : {}}
            animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
          >
            <h2 className="font-display font-bold text-lg" style={{ color: 'var(--text)' }}>
              Appearance
            </h2>

            {/* Dark Mode Toggle */}
            <motion.div
              className="flex items-center justify-between p-4 rounded-lg"
              style={{ background: 'var(--bg-card-2)' }}
              whileHover={!prefersReducedMotion ? { scale: 1.02 } : {}}
            >
              <div className="flex items-center gap-3">
                {isDark ? (
                  <Moon size={20} style={{ color: 'var(--gold)' }} />
                ) : (
                  <Sun size={20} style={{ color: 'var(--gold)' }} />
                )}
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                    Dark Mode
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {isDark ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
              <motion.button
                className="w-12 h-7 rounded-full relative"
                style={{ background: isDark ? 'var(--primary)' : 'var(--divider)' }}
                onClick={handleDarkModeChange}
                whileTap={!prefersReducedMotion ? { scale: 0.95 } : {}}
              >
                <motion.div
                  className="absolute w-5 h-5 bg-white rounded-full"
                  animate={{ left: isDark ? '24px' : '4px' }}
                  transition={!prefersReducedMotion ? { type: 'spring', damping: 20 } : {}}
                />
              </motion.button>
            </motion.div>
          </motion.section>

          {/* Sound Section */}
          <motion.section
            className="clay-card p-6 flex flex-col gap-4"
            initial={!prefersReducedMotion ? { opacity: 0, y: 12 } : {}}
            animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
          >
            <h2 className="font-display font-bold text-lg" style={{ color: 'var(--text)' }}>
              Audio
            </h2>

            {/* Sound Effects Toggle */}
            <motion.div
              className="flex items-center justify-between p-4 rounded-lg"
              style={{ background: 'var(--bg-card-2)' }}
              whileHover={!prefersReducedMotion ? { scale: 1.02 } : {}}
            >
              <div className="flex items-center gap-3">
                {soundOn ? (
                  <Volume2 size={20} style={{ color: 'var(--primary)' }} />
                ) : (
                  <VolumeX size={20} style={{ color: 'var(--text-muted)' }} />
                )}
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                    Sound Effects
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {soundOn ? 'On' : 'Off'}
                  </p>
                </div>
              </div>
              <motion.button
                className="w-12 h-7 rounded-full relative"
                style={{ background: soundOn ? 'var(--primary)' : 'var(--divider)' }}
                onClick={handleSoundChange}
                whileTap={!prefersReducedMotion ? { scale: 0.95 } : {}}
              >
                <motion.div
                  className="absolute w-5 h-5 bg-white rounded-full"
                  animate={{ left: soundOn ? '24px' : '4px' }}
                  transition={!prefersReducedMotion ? { type: 'spring', damping: 20 } : {}}
                />
              </motion.button>
            </motion.div>
          </motion.section>

          {/* Animation Section */}
          <motion.section
            className="clay-card p-6 flex flex-col gap-4"
            initial={!prefersReducedMotion ? { opacity: 0, y: 12 } : {}}
            animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
          >
            <h2 className="font-display font-bold text-lg" style={{ color: 'var(--text)' }}>
              Motion
            </h2>

            {/* Reduced Motion Info */}
            <div className="p-4 rounded-lg" style={{ background: 'var(--primary-light)', borderLeft: '4px solid var(--primary)' }}>
              <p className="text-sm" style={{ color: 'var(--primary)' }}>
                Your system is set to prefer {prefersReducedMotion ? 'reduced' : 'full'} motion. CrossNotes respects your preference.
              </p>
            </div>

            {/* Animations Toggle */}
            <motion.div
              className="flex items-center justify-between p-4 rounded-lg"
              style={{ background: 'var(--bg-card-2)' }}
              whileHover={!prefersReducedMotion ? { scale: 1.02 } : {}}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full"
                  style={{
                    background: settings.animationsEnabled
                      ? 'var(--primary)'
                      : 'var(--divider)',
                  }}
                />
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                    Smooth Animations
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {settings.animationsEnabled ? 'On' : 'Off'}
                  </p>
                </div>
              </div>
              <motion.button
                className="w-12 h-7 rounded-full relative"
                style={{ background: settings.animationsEnabled ? 'var(--primary)' : 'var(--divider)' }}
                onClick={() => handleToggle('animationsEnabled')}
                whileTap={!prefersReducedMotion ? { scale: 0.95 } : {}}
              >
                <motion.div
                  className="absolute w-5 h-5 bg-white rounded-full"
                  animate={{ left: settings.animationsEnabled ? '24px' : '4px' }}
                  transition={!prefersReducedMotion ? { type: 'spring', damping: 20 } : {}}
                />
              </motion.button>
            </motion.div>
          </motion.section>

          {/* Account Section */}
          {user && (
            <motion.section
              className="clay-card p-6 flex flex-col gap-4"
              initial={!prefersReducedMotion ? { opacity: 0, y: 12 } : {}}
              animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
            >
              <h2 className="font-display font-bold text-lg" style={{ color: 'var(--text)' }}>
                Account
              </h2>

              <div className="p-4 rounded-lg" style={{ background: 'var(--bg-card-2)' }}>
                <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                  Signed in as
                </p>
                <p className="text-sm font-semibold mt-1" style={{ color: 'var(--text)' }}>
                  {user.displayName || 'User'}
                </p>
                {user.email && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {user.email}
                  </p>
                )}
              </div>
            </motion.section>
          )}

          {/* Data Section */}
          <motion.section
            className="clay-card p-6 flex flex-col gap-4"
            initial={!prefersReducedMotion ? { opacity: 0, y: 12 } : {}}
            animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
          >
            <h2 className="font-display font-bold text-lg" style={{ color: 'var(--text)' }}>
              Data & Storage
            </h2>

            <motion.button
              onClick={handleClearData}
              className="flex items-center gap-3 p-4 rounded-lg w-full text-left"
              style={{
                background: settings.clearDataConfirm ? '#fee2e2' : 'var(--bg-card-2)',
                borderLeft: settings.clearDataConfirm ? '4px solid var(--red)' : 'none',
              }}
              whileTap={!prefersReducedMotion ? { scale: 0.98 } : {}}
            >
              <Trash2
                size={20}
                style={{ color: settings.clearDataConfirm ? 'var(--red)' : 'var(--text-muted)' }}
              />
              <div className="flex-1">
                <p className="font-semibold text-sm" style={{ color: settings.clearDataConfirm ? 'var(--red)' : 'var(--text)' }}>
                  {settings.clearDataConfirm ? 'Confirm Clear All Data?' : 'Clear All Local Data'}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {settings.clearDataConfirm
                    ? 'This action cannot be undone'
                    : 'Removes cached data and settings'}
                </p>
              </div>
            </motion.button>
          </motion.section>

          {/* Info Section */}
          <motion.section
            className="clay-card p-6 flex flex-col gap-3 text-center"
            initial={!prefersReducedMotion ? { opacity: 0, y: 12 } : {}}
            animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
          >
            <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
              CrossNotes v1.0
            </p>
            <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>
              Made with care for board exam prep
            </p>
          </motion.section>

          {/* Save Indicator */}
          {saved && (
            <motion.div
              className="flex items-center gap-2 p-4 rounded-lg text-green-700"
              style={{ background: 'var(--green-light)' }}
              initial={!prefersReducedMotion ? { opacity: 0, y: -10 } : {}}
              animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
              exit={!prefersReducedMotion ? { opacity: 0, y: -10 } : {}}
            >
              <Save size={16} />
              <span className="text-sm font-semibold">Settings saved</span>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
