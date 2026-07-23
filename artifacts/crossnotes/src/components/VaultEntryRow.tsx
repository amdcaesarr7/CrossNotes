import { Link } from 'wouter';
import { FileText, BookOpen, Globe, FolderOpen, CheckCircle2, Clock, ExternalLink, ChevronRight } from 'lucide-react';
import type { VaultEntry } from '@/types/vault';

const KIND_META: Record<VaultEntry['kind'], { icon: typeof FileText; label: string }> = {
  past_paper:    { icon: FileText,   label: 'Past Paper' },
  textbook:      { icon: BookOpen,   label: 'Official Textbook' },
  open_resource: { icon: Globe,      label: 'Open Resource' },
  study_asset:   { icon: FolderOpen, label: 'Study Asset' },
};

/** One entry in a Vault subsection. Mirrors the visual language of
 *  .chapter-row (badge row + tappable card) without pulling in any of the
 *  progress/quiz logic that ChapterRow carries — Vault entries are simple
 *  links, not tracked chapter content. */
export default function VaultEntryRow({ entry, slug }: { entry: VaultEntry; slug: string }) {
  const { icon: Icon, label } = KIND_META[entry.kind];
  const goesToChapter = !!entry.linkedChapterId;

  const inner = (
    <div className="chapter-row" style={{ cursor: 'pointer' }}>
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
              <span className="badge badge-revision"><Clock size={11} style={{ display: 'inline', marginRight: 2 }} />Unverified</span>
            )}
          </div>
        </div>

        {goesToChapter ? (
          <ChevronRight size={18} className="shrink-0" style={{ color: 'var(--text-muted)' }} />
        ) : (
          <ExternalLink size={16} className="shrink-0" style={{ color: 'var(--text-muted)' }} />
        )}
      </div>
    </div>
  );

  // Already converted into CrossNotes' own JSON content? Jump straight into
  // the reader instead of opening a raw PDF (per VAULT_FEATURE_PROMPT.md).
  if (goesToChapter) {
    return <Link href={`/notes/${slug}/${entry.linkedChapterId}`}>{inner}</Link>;
  }

  // Everything else — local PDF or external official/CC link — opens in a
  // new tab. Vault is a curated index, not a re-host of the reading UI.
  return (
    <a href={entry.sourceUrl} target="_blank" rel="noopener noreferrer">
      {inner}
    </a>
  );
}
