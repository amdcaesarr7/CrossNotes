import { useState } from 'react';
import { BellRing, BellOff, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useStudyReminders } from '@/hooks/useStudyReminders';

/**
 * "Study reminders" settings card. Standalone (no auth required) so any student
 * can set a daily nudge. Delivery + persistence live in useStudyReminders.
 */
export default function StudyReminderCard() {
  const { supported, permission, enabled, time, active, enable, disable, updateTime, sendTest } = useStudyReminders();
  const [working, setWorking] = useState(false);

  if (!supported) {
    return (
      <div className="clay-card p-4 flex items-start gap-3" style={{ background: 'var(--bg-card-2)', borderColor: 'var(--divider)' }}>
        <BellOff size={20} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
        <div>
          <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>Study reminders</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            This browser can’t show reminders. Install CrossNotes to your home screen for daily nudges.
          </p>
        </div>
      </div>
    );
  }

  const blocked = permission === 'denied';

  const onToggle = async () => {
    setWorking(true);
    try {
      if (enabled) {
        await disable();
        toast('Reminders off');
      } else {
        const perm = await enable(time);
        if (perm === 'granted') toast.success(`Daily reminder set for ${time}`);
        else if (perm === 'denied') toast.error('Notifications are blocked in your browser settings');
      }
    } finally {
      setWorking(false);
    }
  };

  const onTest = async () => {
    const perm = await sendTest();
    if (perm === 'granted') toast('Sent a test reminder 🔔');
    else if (perm === 'denied') toast.error('Notifications are blocked in your browser settings');
  };

  return (
    <div className="clay-card p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center border-2 shrink-0"
          style={{
            background: active ? 'var(--primary-light)' : 'var(--bg-card-2)',
            borderColor: active ? 'var(--primary-border)' : 'var(--divider)',
            color: 'var(--primary)',
          }}
        >
          {active ? <BellRing size={20} /> : <BellOff size={20} />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-base leading-tight" style={{ color: 'var(--text)' }}>Study reminders</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>A daily nudge from Mew to keep your streak alive 🔥</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={enabled ? 'Turn off study reminders' : 'Turn on study reminders'}
          disabled={working || blocked}
          onClick={onToggle}
          className="cn-switch shrink-0"
          data-on={enabled ? 'true' : 'false'}
        >
          <span className="cn-switch-thumb" />
        </button>
      </div>

      {blocked && (
        <p className="text-xs font-semibold" style={{ color: '#b91c1c' }}>
          Notifications are blocked. Allow them for CrossNotes in your browser or site settings, then turn this on.
        </p>
      )}

      {enabled && !blocked && (
        <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
          <label className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text)' }}>
            Remind me at
            <input
              type="time"
              value={time}
              onChange={(e) => {
                if (e.target.value) updateTime(e.target.value);
              }}
              className="cn-time-input"
            />
          </label>
          <button type="button" onClick={onTest} className="clay-btn-ghost text-xs py-2 px-3 inline-flex items-center gap-1.5">
            <Send size={13} /> Test
          </button>
        </div>
      )}
    </div>
  );
}
