import { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  resultCount: number;
  total: number;
}

/** Claymorphism search field for filtering the notes in a chapter. */
export default function NoteSearchBar({ value, onChange, resultCount, total }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const active = value.trim().length > 0;

  return (
    <div className="note-search" role="search">
      <label htmlFor="note-search-input" className="sr-only">Search notes in this chapter</label>
      <div className="note-search-field">
        <Search size={18} className="note-search-icon" aria-hidden="true" />
        <input
          id="note-search-input"
          ref={inputRef}
          type="search"
          inputMode="search"
          autoComplete="off"
          spellCheck={false}
          className="note-search-input"
          placeholder="Search this chapter"
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Escape') onChange(''); }}
        />
        {active && (
          <button type="button" className="note-search-clear" onClick={() => { onChange(''); inputRef.current?.focus(); }} aria-label="Clear search">
            <X size={15} />
          </button>
        )}
      </div>
      <p className="note-search-status" aria-live="polite">
        {active ? `${resultCount} of ${total} ${total === 1 ? 'note' : 'notes'}` : ''}
      </p>
    </div>
  );
}
