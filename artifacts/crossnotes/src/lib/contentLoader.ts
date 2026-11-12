/**
 * contentLoader.ts — runtime content loading layer.
 *
 * Fetches the manifest once per session, then loads individual chapter JSON
 * files on demand. Provides in-memory caching and in-flight deduplication so
 * the same chapter is never fetched twice concurrently.
 *
 * Chapter files are served from public/data/{slug}/{chapterId}.json.
 * The manifest is at public/data/manifest.json.
 */

import type { StaticChapter } from "@/hooks/useContent";

// ---- Manifest types ----

export interface ManifestChapterMeta {
  id: string;
  num: number;
  title: string;
  emoji?: string;
  kind?: "chapter" | "paper";
  section?: string;
  part?: number;
  overview?: {
    summary: string;
    youWillLearn?: string[];
  };
  order: number;
  path: string;
  size: number;
  hash: string;
  updatedAt: string;
  tags: string[];
  noteCount: number;
  solutionCount: number;
  flashcardCount: number;
  quizCount: number;
}

export interface ManifestSubject {
  slug: string;
  name: string;
  chapters: ManifestChapterMeta[];
}

export interface Manifest {
  schemaVersion: number;
  contentVersion: string;
  generatedAt: string;
  subjects: ManifestSubject[];
}

// ---- Module-level state ----

let manifestCache: Manifest | null = null;
let manifestPromise: Promise<Manifest> | null = null;

const chapterCache = new Map<string, StaticChapter>();
const inFlight = new Map<string, Promise<StaticChapter | null>>();

// ---- Manifest loading ----

/**
 * Fetches /data/manifest.json and caches the result for the session.
 * Throws on network or parse failure (caller should show an error state).
 * Concurrent callers share the same in-flight request.
 */
export async function loadManifest(): Promise<Manifest> {
  if (manifestCache) return manifestCache;

  if (manifestPromise) return manifestPromise;

  manifestPromise = (async () => {
    try {
      const res = await fetch("/data/manifest.json");
      if (!res.ok) {
        throw new Error(`Failed to load manifest: ${res.status} ${res.statusText}`);
      }
      const data: Manifest = await res.json();
      manifestCache = data;
      return data;
    } catch (error) {
      // Permit a later route change or reconnect to retry a failed manifest
      // request instead of keeping a permanently rejected promise around.
      manifestPromise = null;
      throw error;
    }
  })();

  return manifestPromise;
}

/**
 * Returns the ManifestChapterMeta for a chapter synchronously.
 * Only valid after loadManifest() has resolved; returns undefined before that.
 */
export function getChapterMeta(slug: string, chapterId: string): ManifestChapterMeta | undefined {
  if (!manifestCache) return undefined;
  const subject = manifestCache.subjects.find((s) => s.slug === slug);
  return subject?.chapters.find((c) => c.id === chapterId);
}

// ---- Chapter loading ----

/**
 * Loads a single chapter JSON by slug and chapterId.
 * - Returns from in-memory cache if available.
 * - Deduplicates concurrent requests for the same chapter.
 * - Returns null on any fetch or parse failure (never throws).
 */
export async function loadChapter(slug: string, chapterId: string): Promise<StaticChapter | null> {
  const key = `${slug}/${chapterId}`;

  const cached = chapterCache.get(key);
  if (cached) return cached;

  const existing = inFlight.get(key);
  if (existing) return existing;

  const promise = (async (): Promise<StaticChapter | null> => {
    try {
      const manifest = await loadManifest();
      const subject = manifest.subjects.find((s) => s.slug === slug);
      const meta = subject?.chapters.find((c) => c.id === chapterId);
      if (!meta) return null;

      // The manifest path is authoritative. The hash query makes the chapter
      // URL content-addressed so a deployed update cannot reuse an old SW
      // response for the same chapter id.
      const separator = meta.path.includes("?") ? "&" : "?";
      const url = `${meta.path}${separator}v=${encodeURIComponent(meta.hash)}`;

      const res = await fetch(url);
      if (!res.ok) return null;

      const chapter: StaticChapter = await res.json();
      chapterCache.set(key, chapter);
      return chapter;
    } catch {
      return null;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, promise);
  return promise;
}

// ---- Prefetch helpers ----

/**
 * Schedules a background prefetch of a chapter. Does nothing on slow or
 * data-saver connections. Uses requestIdleCallback when available.
 */
export function prefetchChapter(slug: string, chapterId: string): void {
  if (typeof navigator === "undefined") return;

  // Respect data-saver and slow connections
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (conn?.saveData === true) return;
  if (conn?.effectiveType === "2g" || conn?.effectiveType === "slow-2g") return;

  const run = () => { loadChapter(slug, chapterId); };

  const idleWindow = window as Window & {
    requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  };

  if (idleWindow.requestIdleCallback) {
    idleWindow.requestIdleCallback(run, { timeout: 2000 });
  } else {
    setTimeout(run, 200);
  }
}

/**
 * Finds the chapter after currentChapterId (by order) and prefetches it.
 */
export function prefetchNextChapter(slug: string, currentChapterId: string): void {
  if (!manifestCache) {
    void loadManifest().then(() => prefetchNextChapter(slug, currentChapterId));
    return;
  }
  const subject = manifestCache.subjects.find((s) => s.slug === slug);
  if (!subject) return;

  const sorted = subject.chapters.slice().sort((a, b) => a.order - b.order);
  const idx = sorted.findIndex((c) => c.id === currentChapterId);
  if (idx === -1 || idx + 1 >= sorted.length) return;

  prefetchChapter(slug, sorted[idx + 1].id);
}
