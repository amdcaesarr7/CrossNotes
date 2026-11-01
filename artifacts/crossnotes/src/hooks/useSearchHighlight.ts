import { useEffect, type RefObject } from 'react';

/**
 * Highlights every match of the query terms inside `ref` using the CSS Custom
 * Highlight API. No DOM mutation, so interactive note blocks keep their state.
 * Silently does nothing on browsers without support.
 */
export function useSearchHighlight(ref: RefObject<HTMLElement | null>, query: string, deps: unknown[] = []) {
  useEffect(() => {
    const css = (globalThis as any).CSS;
    const HighlightCtor = (globalThis as any).Highlight;
    if (!css?.highlights || !HighlightCtor) return;
    css.highlights.delete('cn-search');

    const root = ref.current;
    const terms = query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
    if (!root || terms.length === 0) return;

    const ranges: Range[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = (node.nodeValue ?? '').toLocaleLowerCase();
      if (!text.trim()) continue;
      for (const term of terms) {
        let from = 0;
        for (let at = text.indexOf(term, from); at !== -1; at = text.indexOf(term, from)) {
          const r = new Range();
          r.setStart(node, at);
          r.setEnd(node, at + term.length);
          ranges.push(r);
          from = at + term.length;
        }
      }
    }
    if (ranges.length) css.highlights.set('cn-search', new HighlightCtor(...ranges));
    return () => css.highlights.delete('cn-search');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, ...deps]);
}
