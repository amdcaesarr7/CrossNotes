## 2025-05-18 - Heavy Math Solution Regex Parsing
**Learning:** Dense mathematical solution content in CrossNotes requires line-by-line normalization and multi-regex matching. Without `useMemo`, re-renders (e.g. search input changes, page navigation) re-parse thousands of lines on every keystroke.
**Action:** Always wrap heavy string normalization and markdown/math block parsing in `useMemo` keyed by `content`.
