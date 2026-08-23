import { useMemo, useState } from 'react';
import { BookOpenCheck, ChevronLeft, ChevronRight, FileSearch, FolderOpen, Search, Sparkles } from 'lucide-react';
import type { StaticNote } from '@/hooks/useContent';
import NoteBlockRenderer from '@/components/NoteBlockRenderer';
import { getSolutionSetCategory, getSolutionSetLabel, type SolutionSetCategory } from '@/lib/importedSolutions';
import { getMathSolutionPages } from '@/lib/mathSolutionPages';
import { normalizeMathSolutionContent } from '@/lib/mathSolutionContent';

type CategoryFilter = 'all' | SolutionSetCategory;

interface MathsPracticeLibraryProps {
  notes: StaticNote[];
  chapterTitle: string;
}

const FILTERS: Array<{ id: CategoryFilter; label: string }> = [
  { id: 'all', label: 'All sets' },
  { id: 'practice', label: 'Practice Sets' },
  { id: 'problem', label: 'Problem Sets' },
];

function searchText(note: StaticNote) {
  return `${getSolutionSetLabel(note)} ${normalizeMathSolutionContent(note.content ?? '')}`.toLocaleLowerCase();
}

/** A chapter-local, searchable reader for dense Maharashtra Board Maths solutions. */
export default function MathsPracticeLibrary({ notes, chapterTitle }: MathsPracticeLibraryProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [activeNoteId, setActiveNoteId] = useState(notes[0]?.id ?? '');
  const [pageIndex, setPageIndex] = useState(0);

  const sets = useMemo(() => notes.map(note => ({
    note,
    label: getSolutionSetLabel(note),
    category: getSolutionSetCategory(note),
    search: searchText(note),
  })), [notes]);

  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredSets = useMemo(() => sets.filter(set => (
    (filter === 'all' || set.category === filter)
    && (!normalizedQuery || set.search.includes(normalizedQuery))
  )), [filter, normalizedQuery, sets]);

  const activeSet = filteredSets.find(set => set.note.id === activeNoteId) ?? filteredSets[0] ?? null;
  const pages = useMemo(() => getMathSolutionPages(activeSet?.note.content ?? ''), [activeSet?.note.content]);
  const safePageIndex = Math.min(pageIndex, Math.max(pages.length - 1, 0));
  const activePage = pages[safePageIndex];

  const selectSet = (id: string) => {
    setActiveNoteId(id);
    setPageIndex(0);
  };

  const countFor = (id: CategoryFilter) => id === 'all' ? sets.length : sets.filter(set => set.category === id).length;

  return (
    <section className="maths-practice-library" aria-label={`${chapterTitle} Practice Set library`}>
      <div className="maths-library-intro">
        <span className="maths-library-eyebrow"><Sparkles size={14} /> Maths study library</span>
        <h2>Find a set. Study one question at a time.</h2>
        <p>Each Practice Set now opens as a focused reader with its own searchable set card and question-led pages.</p>
      </div>

      <label className="maths-library-search">
        <Search size={18} aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => { setQuery(event.target.value); setPageIndex(0); }}
          placeholder="Search a set, topic, or question…"
          aria-label="Search Maths Practice Sets"
        />
      </label>

      <div className="maths-library-filters" aria-label="Filter Maths solution sets">
        {FILTERS.map(option => (
          <button
            key={option.id}
            type="button"
            className={`maths-library-filter${filter === option.id ? ' is-active' : ''}`}
            onClick={() => { setFilter(option.id); setPageIndex(0); }}
            aria-pressed={filter === option.id}
          >
            {option.label} <span>{countFor(option.id)}</span>
          </button>
        ))}
      </div>

      <div className="maths-library-result-meta" aria-live="polite">
        <FolderOpen size={15} />
        <span>{filteredSets.length === sets.length ? `${sets.length} sets in this chapter` : `${filteredSets.length} matching sets`}</span>
      </div>

      {filteredSets.length === 0 ? (
        <div className="maths-library-empty">
          <FileSearch size={28} />
          <strong>No matching Practice Set</strong>
          <p>Try a chapter keyword, a set number, or a question topic.</p>
          <button type="button" className="clay-btn-ghost" onClick={() => { setQuery(''); setFilter('all'); }}>Clear search</button>
        </div>
      ) : (
        <>
          <div className="maths-set-grid">
            {filteredSets.map(set => {
              const isActive = activeSet?.note.id === set.note.id;
              return (
                <button
                  key={set.note.id}
                  type="button"
                  className={`maths-set-card${isActive ? ' is-active' : ''}`}
                  onClick={() => selectSet(set.note.id)}
                  aria-pressed={isActive}
                >
                  <span className={`maths-set-kind ${set.category}`}>{set.category === 'problem' ? 'Problem Set' : 'Practice Set'}</span>
                  <strong>{set.label.replace(/^(?:Practice|Problem) Set\s*/i, '')}</strong>
                  <small>Open focused reader</small>
                </button>
              );
            })}
          </div>

          {activeSet && activePage && (
            <section className="maths-reader-shell" aria-label={`${activeSet.label} reader`}>
              <div className="maths-reader-heading">
                <div>
                  <span className="maths-reader-kicker"><BookOpenCheck size={15} /> {activeSet.category === 'problem' ? 'Problem Set' : 'Practice Set'}</span>
                  <h3>{activeSet.label}</h3>
                  <p>{chapterTitle} · Page {safePageIndex + 1} of {pages.length}</p>
                </div>
                <span className="maths-reader-page-label">{activePage.label}</span>
              </div>

              {pages.length > 1 && (
                <div className="maths-reader-page-tabs" aria-label="Reader pages">
                  {pages.map((page, index) => (
                    <button
                      key={page.id}
                      type="button"
                      className={safePageIndex === index ? 'is-active' : ''}
                      onClick={() => setPageIndex(index)}
                      aria-current={safePageIndex === index ? 'page' : undefined}
                    >
                      <span>{index + 1}</span> {page.label}
                    </button>
                  ))}
                </div>
              )}

              <NoteBlockRenderer
                key={`${activeSet.note.id}-${activePage.id}`}
                note={{
                  ...activeSet.note,
                  title: `${activeSet.label} · ${activePage.label}`,
                  content: activePage.content,
                }}
                index={safePageIndex}
              />

              {pages.length > 1 && (
                <nav className="maths-reader-pagination" aria-label="Practice Set page navigation">
                  <button
                    type="button"
                    className="clay-btn-ghost"
                    onClick={() => setPageIndex(Math.max(0, safePageIndex - 1))}
                    disabled={safePageIndex === 0}
                  >
                    <ChevronLeft size={17} /> Previous
                  </button>
                  <span>Page {safePageIndex + 1} / {pages.length}</span>
                  <button
                    type="button"
                    className="clay-btn"
                    onClick={() => setPageIndex(Math.min(pages.length - 1, safePageIndex + 1))}
                    disabled={safePageIndex === pages.length - 1}
                  >
                    Next <ChevronRight size={17} />
                  </button>
                </nav>
              )}
            </section>
          )}
        </>
      )}
    </section>
  );
}
