import { useState, type FormEvent } from 'react';
import { useParams } from 'wouter';
import { Link } from 'wouter';
import { LockKeyhole } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useStaticSubject } from '@/hooks/useContent';
import { useVaultSubsections } from '@/hooks/useVault';
import { useHead, useBreadcrumb } from '@/hooks/useSeo';
import { GENERAL_SHELF, getSpecialShelf } from '@/data/vault/meta';
import AppHeader from '@/components/AppHeader';
import BottomNav from '@/components/BottomNav';
import VaultEntryRow from '@/components/VaultEntryRow';
import '../crossnotes.css';

export default function VaultSubject() {
  const { isDark } = useTheme();
  const params = useParams<{ slug: string }>();
  const slug = params.slug || '';
  const isSecretShelf = slug === 'super-secret-stuffs-inside';
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');

  const isGeneral = slug === 'general';
  const subject = useStaticSubject(slug);
  const meta = isGeneral ? GENERAL_SHELF : (getSpecialShelf(slug) ?? subject);
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

  useHead({
    title: `${meta.name} Resources — ${meta.description ?? 'Study Material'} | CrossNotes`,
    description: `Browse ${meta.name} study resources and materials in the CrossNotes Resource Vault. ${meta.description ?? ''}`,
    noIndex: isSecretShelf,
  });
  useBreadcrumb([
    { name: 'Home', url: '/' },
    { name: 'Vault', url: '/vault' },
    { name: meta.name, url: `/vault/${slug}` },
  ]);

  const colorKey = meta.color || 'gold';
  const totalEntries = subsections.reduce((n, s) => n + (s.entries?.length ?? 0), 0);

  function handlePinSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pin === '9568') {
      setIsUnlocked(true);
      setPin('');
      setPinError('');
      return;
    }
    setPin('');
    setPinError('That PIN did not match. Try again.');
  }

  if (isSecretShelf && !isUnlocked) {
    return (
      <div className={`cn-body ${isDark ? 'dark-mode' : ''}`}>
        <AppHeader backHref="/vault" backLabel="Vault" />
        <main className="page-content" style={{ maxWidth: 680 }}>
          <form
            className="clay-card p-6 flex flex-col items-center gap-4 text-center"
            style={{ background: `var(--${colorKey}-bg)`, borderColor: `var(--${colorKey}-border)` }}
            onSubmit={handlePinSubmit}
          >
            <LockKeyhole size={36} style={{ color: 'var(--primary)' }} aria-hidden="true" />
            <div>
              <h1 className="font-display font-black text-xl" style={{ color: 'var(--text)' }}>Enter the four-digit PIN</h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Unlock this collection of extra study PDFs.</p>
            </div>
            <label className="sr-only" htmlFor="secret-vault-pin">Four-digit PIN</label>
            <input
              id="secret-vault-pin"
              className="w-40 rounded-xl border-2 px-4 py-3 text-center text-xl tracking-[0.5em]"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--divider)', color: 'var(--text)' }}
              type="password"
              inputMode="numeric"
              autoComplete="off"
              pattern="[0-9]{4}"
              maxLength={4}
              value={pin}
              onChange={event => {
                setPin(event.target.value.replace(/\D/g, '').slice(0, 4));
                setPinError('');
              }}
              aria-invalid={!!pinError}
              aria-describedby={pinError ? 'secret-vault-pin-error' : undefined}
              required
            />
            {pinError && <p id="secret-vault-pin-error" className="text-sm text-red-600" role="alert">{pinError}</p>}
            <button className="clay-btn" type="submit" disabled={pin.length !== 4}>Unlock</button>
            <p className="text-xs max-w-sm" style={{ color: 'var(--text-muted)' }}>
              This is a casual screen lock only; the PDFs are not protected from direct access.
            </p>
          </form>
        </main>
        <BottomNav />
      </div>
    );
  }

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
