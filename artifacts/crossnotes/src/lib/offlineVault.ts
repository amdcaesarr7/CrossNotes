/**
 * Opt-in offline storage for Vault files (large PDFs / PPTX).
 *
 * We write straight into Cache Storage from the window; the service worker
 * (public/sw.js) then serves these back when the device is offline. This is
 * deliberately separate from the app cache: Vault files are big and are cached
 * only on an explicit tap, and the SW keeps this cache alive across app updates.
 *
 * Keep VAULT_CACHE in sync with public/sw.js.
 */

export const VAULT_CACHE = 'crossnotes-vault-v1';
export interface CachedVaultEntry {
  url: string;
  size?: number;
}

const supported = typeof caches !== 'undefined';

/** Only local Vault files (same-origin paths) can be saved offline. External
 *  official links (ebalbharati.in, …) are just bookmarks — nothing to cache. */
export function isOfflineSavable(sourceUrl: string): boolean {
  return supported && sourceUrl.startsWith('/');
}

export async function isVaultFileSaved(url: string): Promise<boolean> {
  if (!supported) return false;
  try {
    const cache = await caches.open(VAULT_CACHE);
    return !!(await cache.match(url));
  } catch {
    return false;
  }
}

/** Fetches + stores the file. Rejects if offline or the response isn't 2xx. */
export async function saveVaultFile(url: string): Promise<void> {
  const cache = await caches.open(VAULT_CACHE);
  await cache.add(url);
}

export async function removeVaultFile(url: string): Promise<void> {
  if (!supported || !isOfflineSavable(url)) return;
  const cache = await caches.open(VAULT_CACHE);
  await cache.delete(url);
}

/** List the local Vault files currently stored in the opt-in cache. */
export async function listVaultFiles(): Promise<CachedVaultEntry[]> {
  if (!supported) return [];
  try {
    const cache = await caches.open(VAULT_CACHE);
    const requests = await cache.keys();
    return await Promise.all(requests.map(async (request) => {
      const response = await cache.match(request);
      const length = response?.headers.get('content-length');
      return { url: new URL(request.url).pathname, ...(length ? { size: Number(length) } : {}) };
    }));
  } catch {
    return [];
  }
}

/** Remove every cached Vault entry without touching the app or reminder caches. */
export async function clearVaultFiles(): Promise<void> {
  if (!supported) return;
  try {
    await caches.delete(VAULT_CACHE);
  } catch {
    // Storage may be unavailable or already reclaimed by the browser.
  }
}
