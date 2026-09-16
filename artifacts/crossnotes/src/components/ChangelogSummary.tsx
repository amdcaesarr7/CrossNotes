import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { getUnseenChangelog, markChangelogSeen } from '@/lib/changelog';

export default function ChangelogSummary() {
  const [entries] = useState(getUnseenChangelog);
  const [visible, setVisible] = useState(entries.length > 0);
  if (!visible) return null;
  return (
    <aside className="changelog-summary" role="status" aria-live="polite">
      <button className="changelog-summary__close" onClick={() => { markChangelogSeen(); setVisible(false); }} aria-label="Dismiss CrossNotes updates"><X size={15} /></button>
      <span className="settings-kicker"><Sparkles size={14} /> While you were away</span>
      <strong>{entries.length} new CrossNotes update{entries.length === 1 ? '' : 's'}</strong>
      <span>{entries[0]?.title}</span>
      <button className="settings-inline-btn" onClick={() => { markChangelogSeen(); setVisible(false); }}>Catch up in Settings</button>
    </aside>
  );
}
