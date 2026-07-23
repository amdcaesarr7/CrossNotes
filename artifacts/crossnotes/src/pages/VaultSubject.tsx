import { useParams } from 'wouter';
import { Link } from 'wouter';
import { useTheme } from '@/contexts/ThemeContext';
import { useStaticSubject } from '@/hooks/useContent';
import { useVaultSubsections } from '@/hooks/useVault';
import AppHeader from '@/components/AppHeader';
import BottomNav from '@/components/BottomNav';
import VaultEntryRow from '@/components/VaultEntryRow';
import '../crossnotes.css';

const GENERAL_META = { name: 'General', emoji: '🗂️', color: 'gold', description: "Study assets that aren't tied to one subject" };

export default function VaultSubject() {
  const { isDark } = useTheme();
  const params = useParams<{ slug: string }>();
  const slug = params.slug || '';

  const isGeneral = slug === 'general';
  const subject = useStaticSubject(slug);
  const meta = isGeneral ? GENERAL_META : subject;
  const { subsections, loading } = useVaultSubsections(slug);

  if (!meta) {
    return (
      <div className={`cn-body ${isDark ? 'dark-mode' : ''}`}>
        <AppHeader backHref="/vault" backLabel="Vault" />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center pb-24">
          <p className="text-5xl">😵</p>
          <h2 className="font-display font-bold text-xl" style={{ color: 'var(--text)' }}>Not found</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>There's no Vault shelf called "{slug}".</p>
          <Link href="/vault"><button className="clay-btn">← Back to Vault</button></Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  const colorKey = meta.color || 'gold';
  const totalEntries = subsections.reduce((n, s) => n + (s.entries?.length ?? 0), 0);

  return (
    <div className={`cn-body ${isDark ? 'dark-mode' : ''}`}>
      <AppHeader backHref="/vault" backLabel="Vault" />

      <main className="page-content" style={{ maxWidth: 680 }}>
        <div
          className="clay-card p-5 flex items-center gap-4"
          style={{ background: `var(--${colorKey}-bg)`, borderColor: `var(--${colorKey}-border)` }}
        >
          <span className="text-5xl">{meta.emoji}</span>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-black text-xl leading-tight" style={{ color: 'var(--text)' }}>{meta.name}</h1>
            {meta.description && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{meta.description}</p>}
            <div className="flex items-center gap-2 mt-2">
              <span className="badge badge-new">{totalEntries} {totalEntries === 1 ? 'item' : 'items'}</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: 'var(--bg-card-2)' }} />)}
          </div>
        ) : subsections.length === 0 ? (
          <div className="clay-card p-8 text-center" style={{ color: 'var(--text-muted)' }}>
            <p className="text-3xl mb-2">🗄️</p>
            <p className="font-bold">No Vault content here yet.</p>
          </div>
        ) : (
          // Only subsections with a title + at least one entry ever reach
          // here — empty subsecN slots ({}) are filtered out by
          // useVaultSubsections before this renders.
          subsections.map((sub, i) => (
            <section key={i}>
              <h2 className="section-header mb-3">{sub.emoji ? `${sub.emoji} ` : ''}{sub.title}</h2>
              <div className="flex flex-col gap-3">
                {sub.entries!.map(entry => (
                  <VaultEntryRow key={entry.id} entry={entry} slug={slug} />
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      <BottomNav />
    </div>
  );
}
