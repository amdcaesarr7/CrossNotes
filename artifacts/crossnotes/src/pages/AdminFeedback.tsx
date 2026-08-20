import { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  Bug,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  HeartHandshake,
  Inbox,
  Lightbulb,
  Loader2,
  MessageSquareText,
  Search,
  Send,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import AppHeader from '@/components/AppHeader';
import FeedbackAnalytics from '@/components/FeedbackAnalytics';
import BottomNav from '@/components/BottomNav';
import {
  type FeedbackItem,
  type FeedbackKind,
  type FeedbackStatus,
  updateFeedbackItem,
  useFeedbackItems,
} from '@/lib/feedback';
import { useTheme } from '@/contexts/ThemeContext';
import '../crossnotes.css';

const kindMeta: Record<FeedbackKind, { label: string; icon: typeof Lightbulb; tone: string }> = {
  idea: { label: 'Idea', icon: Lightbulb, tone: 'idea' },
  bug: { label: 'Bug report', icon: Bug, tone: 'bug' },
  encouragement: { label: 'Encouragement', icon: HeartHandshake, tone: 'love' },
};

const statusMeta: Record<FeedbackStatus, { label: string; icon: typeof CircleDot; tone: string }> = {
  new: { label: 'New', icon: CircleDot, tone: 'new' },
  in_review: { label: 'In review', icon: Clock3, tone: 'review' },
  planned: { label: 'Planned', icon: Sparkles, tone: 'planned' },
  resolved: { label: 'Resolved', icon: CheckCircle2, tone: 'resolved' },
  archived: { label: 'Archived', icon: Archive, tone: 'archived' },
};

const statusOptions: FeedbackStatus[] = ['new', 'in_review', 'planned', 'resolved', 'archived'];

function formatDate(raw: string) {
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function relativeTime(raw: string) {
  const diff = Date.now() - new Date(raw).getTime();
  if (!Number.isFinite(diff) || diff < 60_000) return 'Just now';
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'Yesterday' : `${days}d ago`;
}

export default function AdminFeedback() {
  const { isDark } = useTheme();
  const { items, loading, syncing } = useFeedbackItems();
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | 'all'>('all');
  const [kindFilter, setKindFilter] = useState<FeedbackKind | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<FeedbackStatus>('new');
  const [draftNote, setDraftNote] = useState('');
  const [saving, setSaving] = useState(false);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return items.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesKind = kindFilter === 'all' || item.kind === kindFilter;
      const matchesSearch = !query || [item.message, item.userName, item.adminNote].some((value) => value.toLocaleLowerCase().includes(query));
      return matchesStatus && matchesKind && matchesSearch;
    });
  }, [items, kindFilter, search, statusFilter]);

  const selectedItem = items.find((item) => item.id === selectedId) ?? null;

  useEffect(() => {
    if (selectedItem) {
      setDraftStatus(selectedItem.status);
      setDraftNote(selectedItem.adminNote);
    }
  }, [selectedItem?.id]);

  const summary = {
    new: items.filter((item) => item.status === 'new').length,
    inReview: items.filter((item) => item.status === 'in_review').length,
    planned: items.filter((item) => item.status === 'planned').length,
    resolved: items.filter((item) => item.status === 'resolved').length,
  };

  const selectItem = (item: FeedbackItem) => {
    setSelectedId(item.id);
    setDraftStatus(item.status);
    setDraftNote(item.adminNote);
  };

  const saveChanges = async () => {
    if (!selectedItem) return;
    setSaving(true);
    try {
      await updateFeedbackItem(selectedItem, { status: draftStatus, adminNote: draftNote.trim() });
      toast.success('Feedback item updated.');
    } catch {
      toast.error('Could not save this item. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`cn-body ${isDark ? 'dark-mode' : ''}`}>
      <AppHeader title="Feedback desk" backHref="/" backLabel="Home" />
      <main className="page-content admin-feedback-page">
        <section className="admin-feedback-hero">
          <div>
            <span className="admin-feedback-eyebrow"><Sparkles size={14} /> Admin workspace</span>
            <h1>Turn learner voices into better study moments.</h1>
            <p>Review incoming feedback, capture your response, and keep every useful idea moving forward.</p>
          </div>
          <div className="admin-feedback-sync" title={syncing ? 'Syncing feedback' : 'Feedback is up to date'}>
            <span className={syncing ? 'sync-dot syncing' : 'sync-dot'} />
            {syncing ? 'Syncing' : 'Live desk'}
          </div>
        </section>

        <section className="feedback-summary-grid" aria-label="Feedback summary">
          <button className={`feedback-summary-card ${statusFilter === 'new' ? 'active' : ''}`} onClick={() => setStatusFilter(statusFilter === 'new' ? 'all' : 'new')}>
            <span className="summary-icon new"><Inbox size={18} /></span><span><strong>{summary.new}</strong><small>New</small></span>
          </button>
          <button className={`feedback-summary-card ${statusFilter === 'in_review' ? 'active' : ''}`} onClick={() => setStatusFilter(statusFilter === 'in_review' ? 'all' : 'in_review')}>
            <span className="summary-icon review"><Clock3 size={18} /></span><span><strong>{summary.inReview}</strong><small>In review</small></span>
          </button>
          <button className={`feedback-summary-card ${statusFilter === 'planned' ? 'active' : ''}`} onClick={() => setStatusFilter(statusFilter === 'planned' ? 'all' : 'planned')}>
            <span className="summary-icon planned"><Sparkles size={18} /></span><span><strong>{summary.planned}</strong><small>Planned</small></span>
          </button>
          <button className={`feedback-summary-card ${statusFilter === 'resolved' ? 'active' : ''}`} onClick={() => setStatusFilter(statusFilter === 'resolved' ? 'all' : 'resolved')}>
            <span className="summary-icon resolved"><CheckCircle2 size={18} /></span><span><strong>{summary.resolved}</strong><small>Resolved</small></span>
          </button>
        </section>

        <FeedbackAnalytics items={items} />

        <section className="feedback-desk clay-card">
          <div className="feedback-desk-toolbar">
            <div className="feedback-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search messages or people" aria-label="Search feedback" /></div>
            <div className="feedback-filter-group" aria-label="Feedback filters">
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as FeedbackStatus | 'all')} aria-label="Filter by status">
                <option value="all">All statuses</option>
                {statusOptions.map((status) => <option key={status} value={status}>{statusMeta[status].label}</option>)}
              </select>
              <select value={kindFilter} onChange={(event) => setKindFilter(event.target.value as FeedbackKind | 'all')} aria-label="Filter by type">
                <option value="all">All types</option>
                {Object.entries(kindMeta).map(([kind, meta]) => <option key={kind} value={kind}>{meta.label}</option>)}
              </select>
            </div>
          </div>

          <div className="feedback-desk-content">
            <div className="feedback-item-list" aria-label="Feedback items">
              <div className="feedback-list-heading"><span>{filteredItems.length} item{filteredItems.length === 1 ? '' : 's'}</span><span>{statusFilter === 'all' ? 'All feedback' : statusMeta[statusFilter].label}</span></div>
              {loading ? (
                <div className="feedback-empty"><Loader2 className="animate-spin" size={24} /><p>Loading feedback…</p></div>
              ) : filteredItems.length === 0 ? (
                <div className="feedback-empty"><MessageSquareText size={28} /><h2>Nothing here yet</h2><p>Try a different filter, or wait for the next learner note.</p></div>
              ) : (
                filteredItems.map((item) => {
                  const kind = kindMeta[item.kind];
                  const status = statusMeta[item.status];
                  const KindIcon = kind.icon;
                  return (
                    <button key={item.id} className={`feedback-list-item ${selectedId === item.id ? 'selected' : ''}`} onClick={() => selectItem(item)}>
                      <span className={`feedback-list-kind ${kind.tone}`}><KindIcon size={16} /></span>
                      <span className="feedback-list-copy"><span className="feedback-list-topline"><strong>{kind.label}</strong><time>{relativeTime(item.createdAt)}</time></span><span className="feedback-list-message">{item.message}</span><span className={`feedback-status-chip ${status.tone}`}>{status.label}</span></span>
                      <ChevronRight size={17} className="feedback-list-chevron" />
                    </button>
                  );
                })
              )}
            </div>

            <aside className="feedback-detail-panel" aria-label="Selected feedback details">
              {selectedItem ? (() => {
                const kind = kindMeta[selectedItem.kind];
                const status = statusMeta[selectedItem.status];
                const KindIcon = kind.icon;
                return (
                  <div className="feedback-detail-inner">
                    <div className="feedback-detail-heading">
                      <span className={`feedback-detail-kind ${kind.tone}`}><KindIcon size={17} /> {kind.label}</span>
                      <span className={`feedback-status-chip ${status.tone}`}>{status.label}</span>
                    </div>
                    <blockquote>{selectedItem.message}</blockquote>
                    <div className="feedback-author-row"><div className="feedback-author-avatar">{selectedItem.userName.charAt(0).toUpperCase()}</div><span><strong>{selectedItem.userName}</strong><small>{formatDate(selectedItem.createdAt)} · {selectedItem.source === 'firestore' ? 'Synced submission' : 'This device'}</small></span></div>
                    <div className="feedback-manage-divider" />
                    <label className="feedback-admin-field"><span>Status</span><select value={draftStatus} onChange={(event) => setDraftStatus(event.target.value as FeedbackStatus)}>{statusOptions.map((itemStatus) => <option key={itemStatus} value={itemStatus}>{statusMeta[itemStatus].label}</option>)}</select></label>
                    <label className="feedback-admin-field"><span>Admin note</span><textarea value={draftNote} onChange={(event) => setDraftNote(event.target.value)} placeholder="Capture the decision, next step, or internal context…" maxLength={600} /><small>{draftNote.length}/600</small></label>
                    <button className="clay-btn feedback-save-button" onClick={saveChanges} disabled={saving}>{saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}{saving ? 'Saving…' : 'Save changes'}</button>
                  </div>
                );
              })() : (
                <div className="feedback-detail-empty"><div><MessageSquareText size={29} /></div><h2>Pick a feedback item</h2><p>Its details and management controls will appear here.</p></div>
              )}
            </aside>
          </div>
        </section>

        <p className="admin-feedback-footnote">This desk uses the same feedback records that students submit. Configure Firebase security rules before granting staff access in production.</p>
      </main>
      <BottomNav />
    </div>
  );
}
