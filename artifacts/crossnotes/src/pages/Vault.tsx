import { useState, useEffect } from 'react';
import { ChevronRight, ShieldCheck } from 'lucide-react';
import { Link } from 'wouter';
import { useTheme } from '@/contexts/ThemeContext';
import { useStaticSubjects } from '@/hooks/useContent';
import { loadVisibleSubsections } from '@/hooks/useVault';
import AppHeader from '@/components/AppHeader';
import BottomNav from '@/components/BottomNav';
import '../crossnotes.css';

const GENERAL_SHELF = { slug: 'general', name: 'General', emoji: '🗂️', color: 'gold', description: "Study assets that aren't tied to one subject" };

export default function Vault() {
  const { isDark } = useTheme();
  const subjects = useStaticSubjects();
  const [shelvesWithContent, setShelvesWithContent] = useState<Set<string> | null>(null);

  // Static subject list, so it's fine to check all of them (+ "general") in
  // one effect rather than a hook-per-subject, which rules of hooks forbid.
  useEffect(() => {
    let cancelled = false;
    const slugs = [...subjects.map(s => s.slug), GENERAL_SHELF.slug];
    Promise.all(slugs.map(slug => loadVisibleSubsections(slug).then(subs => [slug, subs.length > 0] as const)))
      .then(results => {
        if (cancelled) return;
        setShelvesWithContent(new Set(results.filter(([, has]) => has).map(([slug]) => slug)));
      });
    return () => { cancelled = true; };
  }, [subjects]);

  const loading = shelvesWithContent === null;
  const liveShelves = [
    ...(shelvesWithContent?.has(GENERAL_SHELF.slug) ? [GENERAL_SHELF] : []),
    ...subjects.filter(s => shelvesWithContent?.has(s.slug)),
  ];

  return (
    <div className={`cn-body ${isDark ? 'dark-mode' : ''}`}>
      <AppHeader title="Vault" />

      <main className="page-content">
        <div className="clay-card p-4 flex items-start gap-3" style={{ background: 'var(--bg-card-2)', borderColor: 'var(--divider)' }}>
          <ShieldCheck size={20} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 1 }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            Official, legally-clean reference material — real board papers, official textbook links,
            and open resources. Not Caesar's notes, the real thing.
          </p>
        </div>

        <section>
          <h2 className="section-header mb-3">Browse the Vault</h2>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: 'var(--bg-card-2)' }} />)}
            </div>
          ) : liveShelves.length === 0 ? (
            <div className="clay-card p-8 text-center" style={{ color: 'var(--text-muted)' }}>
              <p className="text-3xl mb-2">🗄️</p>
              <p className="font-bold">Nothing in the Vault yet.</p>
              <p className="text-sm mt-1">
                Drop a <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">vault-&lt;subject&gt;.json</code> into{' '}
                <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">src/data/vault/</code>
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {liveShelves.map(s => (
                <Link key={s.slug} href={`/vault/${s.slug}`}>
                  <div
                    className="clay-card hoverable flex items-center gap-4 p-4 cursor-pointer"
                    style={{ background: `var(--${s.color}-bg)`, borderColor: `var(--${s.color}-border)` }}
                  >
                    <span className="text-4xl">{s.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-bold text-base leading-tight" style={{ color: 'var(--text)' }}>{s.name}</h3>
                      {s.description && <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{s.description}</p>}
                    </div>
                    <ChevronRight size={20} style={{ color: `var(--${s.color}-shadow)`, flexShrink: 0 }} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
