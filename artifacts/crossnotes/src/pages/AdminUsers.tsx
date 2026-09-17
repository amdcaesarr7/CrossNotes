import { useCallback, useEffect, useMemo, useState } from 'react';
import { Mail, RefreshCw, Search, ShieldCheck, UserCheck, UserX, Users } from 'lucide-react';
import { toast } from 'sonner';
import AppHeader from '@/components/AppHeader';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { isConfiguredAdmin, listManagedUsers, sendReleaseEmail, setManagedUserDisabled, type ManagedUser } from '@/lib/admin';
import { useTheme } from '@/contexts/ThemeContext';

function formatDate(value: string | null) {
  if (!value) return 'Never';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
}

export default function AdminUsers() {
  const { user, loading } = useAuth();
  const { isDark } = useTheme();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [query, setQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [savingUid, setSavingUid] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const isAdmin = isConfiguredAdmin(user?.email);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      if (user) setUsers(await listManagedUsers(user));
    } catch (error) {
      console.error('[AdminUsers] Failed to load users:', error);
      toast.error('Could not load registered users.');
    } finally {
      setLoadingUsers(false);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && isAdmin) void loadUsers();
  }, [isAdmin, loadUsers, loading]);

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return users;
    return users.filter((entry) => [entry.email, entry.displayName, entry.uid].some((value) => value?.toLowerCase().includes(normalized)));
  }, [query, users]);

  const toggleDisabled = async (entry: ManagedUser) => {
    setSavingUid(entry.uid);
    try {
      if (!user) return;
      await setManagedUserDisabled(user, entry.uid, !entry.disabled);
      setUsers((current) => current.map((item) => item.uid === entry.uid ? { ...item, disabled: !entry.disabled } : item));
      toast.success(entry.disabled ? 'User re-enabled.' : 'User disabled.');
    } catch (error) {
      console.error('[AdminUsers] Failed to update user:', error);
      toast.error('Could not update this user.');
    } finally {
      setSavingUid(null);
    }
  };

  const sendUpdate = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Add a title and message before sending.');
      return;
    }
    setSending(true);
    try {
      if (!user) return;
      const result = await sendReleaseEmail(user, title.trim(), message.trim());
      if (result.recipientCount === 0) {
        toast.info('There are no registered users with email addresses yet.');
      } else if (result.failedCount > 0) {
        toast.warning(`Sent to ${result.sentCount} of ${result.recipientCount} registered users.`);
      } else {
        toast.success(`Update emailed to ${result.sentCount} registered user${result.sentCount === 1 ? '' : 's'}.`);
      }
      setTitle('');
      setMessage('');
    } catch (error) {
      console.error('[AdminUsers] Failed to send release email:', error);
      toast.error('Could not send the update email.');
    } finally {
      setSending(false);
    }
  };

  if (loading) return null;
  if (!user || !isAdmin) {
    return <div className={`cn-body ${isDark ? 'dark-mode' : ''}`}><AppHeader title="Admin tools" backHref="/" backLabel="Home" /><main className="page-content"><section className="clay-card"><h1>Admin access required</h1><p>Your account is not on the CrossNotes admin allowlist.</p></section></main><BottomNav /></div>;
  }

  return (
    <div className={`cn-body ${isDark ? 'dark-mode' : ''}`}>
      <AppHeader title="Admin tools" backHref="/" backLabel="Home" />
      <main className="page-content" style={{ gap: 20, paddingTop: 22 }}>
        <section className="clay-card">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div><span className="admin-feedback-eyebrow"><ShieldCheck size={14} /> Admin workspace</span><h1 style={{ margin: '12px 0 6px' }}>Manage learners and updates</h1><p className="text-muted">Email the latest change to every registered email address after a push.</p></div>
            <button className="clay-btn" onClick={() => void loadUsers()} disabled={loadingUsers}><RefreshCw size={16} className={loadingUsers ? 'animate-spin' : ''} /> Refresh</button>
          </div>
        </section>

        <section className="clay-card">
          <h2 className="font-display text-xl font-bold flex items-center gap-2"><Mail size={19} /> Email a change</h2>
          <p className="text-muted" style={{ margin: '6px 0 14px' }}>The server sends this only to users returned by Firebase Auth. Disabled accounts are excluded.</p>
          <div className="grid gap-3">
            <input className="feedback-search" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Change title" aria-label="Change title" />
            <textarea className="feedback-admin-field" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="What changed? Keep it short and useful." maxLength={2000} aria-label="Change message" />
            <button className="clay-btn" onClick={() => void sendUpdate()} disabled={sending}>{sending ? 'Sending…' : 'Email registered users'}</button>
          </div>
        </section>

        <section className="clay-card">
          <div className="flex items-center justify-between gap-3 flex-wrap"><h2 className="font-display text-xl font-bold flex items-center gap-2"><Users size={19} /> Registered users <span className="text-muted text-sm">({users.length})</span></h2><div className="feedback-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users" aria-label="Search users" /></div></div>
          {loadingUsers ? <p className="text-muted" style={{ marginTop: 18 }}>Loading users…</p> : filteredUsers.length === 0 ? <p className="text-muted" style={{ marginTop: 18 }}>No registered users match this search.</p> : <div className="grid gap-2" style={{ marginTop: 18 }}>{filteredUsers.map((entry) => <div key={entry.uid} className="flex items-center justify-between gap-3" style={{ padding: 12, border: '1px solid var(--divider)', borderRadius: 14 }}><div className="min-w-0"><strong className="block truncate">{entry.displayName || 'Unnamed learner'}</strong><span className="text-muted text-sm block truncate">{entry.email || 'No email'} · Joined {formatDate(entry.createdAt)}</span><span className="text-muted text-xs">Last sign-in: {formatDate(entry.lastSignInAt)}</span></div><button className="clay-btn" onClick={() => void toggleDisabled(entry)} disabled={savingUid === entry.uid}>{entry.disabled ? <><UserCheck size={16} /> Enable</> : <><UserX size={16} /> Disable</>}</button></div>)}</div>}
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
