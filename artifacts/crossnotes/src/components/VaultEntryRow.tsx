import { Link, useLocation } from 'wouter';
import { FileText, BookOpen, Globe, FolderOpen, CheckCircle2, Clock, ExternalLink, ChevronRight, Clock as ClockIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { VaultEntry } from '@/types/vault';
import { isOfflineSavable } from '@/lib/offlineVault';
import VaultOfflineButton from '@/components/VaultOfflineButton';

const KIND_META: Record<VaultEntry['kind'], { icon: typeof FileText; label: string }> = {
  past_paper:    { icon: FileText,   label: 'Past Paper' },
  textbook:      { icon: BookOpen,   label: 'Official Textbook' },
  open_resource: { icon: Globe,      label: 'Open Resource' },
  study_asset:   { icon: FolderOpen, label: 'Study Asset' },
};

const DOWNLOAD_EXTENSIONS = ['.pptx', '.ppt', '.docx', '.doc', '.xlsx', '.xls', '.zip'];

function isLocalDownload(sourceUrl: string): boolean {
  if (!sourceUrl.startsWith('/')) return false;
  const path = sourceUrl.split(/[?#]/)[0].toLowerCase();
  return DOWNLOAD_EXTENSIONS.some((ext) => path.endsWith(ext));
}

const LAST_OPENED_KEY = 'cn-vault-last-opened';

function getLastOpened(): { entryId: string; slug: string; ts: number } | null {
  try {
    const raw = localStorage.getItem(LAST_OPENED_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setLastOpened(entryId: string, slug: string) {
  try {
    localStorage.setItem(LAST_OPENED_KEY, JSON.stringify({ entryId, slug, ts: Date.now() }));
  } catch { /* ignore */ }
}

/** One entry in a Vault subsection. Mirrors the visual language of
 *  .chapter-row (badge row + tappable card) without pulling in any of the
 *  progress/quiz logic that ChapterRow carries — Vault entries are simple
 *  links, not tracked chapter content. */
export default function VaultEntryRow({ entry, slug }: { entry: VaultEntry; slug: string }) {
  const { icon: Icon, label } = KIND_META[entry.kind];
  const goesToChapter = !!entry.linkedChapterId;
  const savable = !goesToChapter && isOfflineSavable(entry.sourceUrl);

  const [isLastOpened, setIsLastOpened] = useState(false);

  useEffect(() => {
    const last = getLastOpened();
    setIsLastOpened(last?.entryId === entry.id && last?.slug === slug);
  }, [entry.id, slug]);

  const handleClick = (e: React.MouseEvent) => {
    // Track last opened before navigation
    setLastOpened(entry.id, slug);
    // Let default navigation proceed (link behavior)
  };

  const inner = (
    <div className={`chapter-row ${isLastOpened ? 'last-opened' : ''}`} style={{ cursor: 'pointer' }} onClick={handleClick}>
      <div className="flex items-center gap-3">
        <div
          className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center border-2"
          style={{ background: 'var(--bg-card-2)', color: 'var(--text-muted)', borderColor: 'var(--divider)' }}
        >
          <Icon size={18} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm leading-snug truncate" style={{ color: 'var(--text)' }}>{entry.title}</h3>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="badge badge-new">{label}</span>
            {entry.year && <span className="badge badge-new">{entry.year}</span>}
            {entry.medium && <span className="badge badge-new">{entry.medium}</span>}
            {entry.license && <span className="badge badge-new">{entry.license}</span>}
            {entry.status === 'verified' ? (
              <span className="badge badge-done"><CheckCircle2 size={11} style={{ display: 'inline', marginRight: 2 }} />Verified</span>
            ) : (
              <span className="badge badge-revision"><ClockIcon size={11} style={{ display: 'inline', marginRight: 2 }} />Unverified</span>
            )}
            {isLastOpened && (
              <span className="badge badge-new" style={{ background: 'var(--primary-bg)', color: 'var(--primary)', borderColor: 'var(--primary-border)' }}>
                <ClockIcon size={11} style={{ display: 'inline', marginRight: 2 }} />Last opened
              </span>
            )}
          </div>
        </div>

        {savable && <VaultOfflineButton url={entry.sourceUrl} title={entry.title} />}

        {goesToChapter ? (
          <ChevronRight size={18} className="shrink-0" style={{ color: 'var(--text-muted)' }} />
        ) : (
          <ExternalLink size={16} className="shrink-0" style={{ color: 'var(--text-muted)' }} />
        )}
      </div>
    </div>
  );

  if (goesToChapter) {
    return <Link href={`/notes/${slug}/${entry.linkedChapterId}`} aria-label={`Open notes: ${entry.title}`}>{inner}</Link>;
  }

  if (isLocalDownload(entry.sourceUrl)) {
    return (
      <a href={entry.sourceUrl} download aria-label={`Download ${entry.title}`} onClick={handleClick}>
        {inner}
      </a>
    );
  }

  return (
    <a href={entry.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open ${entry.title} (opens in new tab)`} onClick={handleClick}>
      {inner}
    </a>
  );
}