// historyApi.ts — Repository for block translation histories; chrome.storage.local is the backing store

import type { BlockHistory } from '../types';
import { normalizePageUrl } from '../utils/url';

export { normalizePageUrl };

// Internal: derives a storage key from pageUrl + parsedContent.
// Uses a djb2 hash with a 'trans:' prefix so all history keys are namespaced.
// NOTE: djb2 has a small but non-zero collision risk — two different (pageUrl, parsedContent)
// pairs can produce the same hash. In practice this is extremely rare and collisions only
// cause one block's history to overwrite another's, not data corruption.
const storageKey = (pageUrl: string, parsedContent: string): string => {
  let hash = 5381;
  const str = pageUrl + '::' + parsedContent;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash >>> 0; // keep unsigned 32-bit
  }
  return `trans:${hash.toString(36)}`;
};

// Internal: type guard + backfills identity fields missing from old storage format
const hydrateHistory = (
  value: unknown,
  pageUrl: string,
  parsedContent: string
): BlockHistory | null => {
  if (typeof value !== 'object' || value === null) return null;
  if (!Array.isArray((value as BlockHistory).entries)) return null;
  return { ...(value as BlockHistory), pageUrl, parsedContent };
};

// Internal: loads all storage entries whose key starts with 'trans:' and matches a predicate
const getTransEntries = (
  predicate: (key: string, value: BlockHistory) => boolean
): Promise<{ keys: string[]; histories: BlockHistory[] }> =>
  new Promise((resolve) => {
    chrome.storage.local.get(null, (all) => {
      const keys: string[] = [];
      const histories: BlockHistory[] = [];
      for (const [k, v] of Object.entries(all)) {
        if (!k.startsWith('trans:')) continue;
        if (typeof v !== 'object' || v === null) continue;
        const h = v as BlockHistory;
        if (!Array.isArray(h.entries)) continue;
        if (predicate(k, h)) {
          keys.push(k);
          histories.push(h);
        }
      }
      resolve({ keys, histories });
    });
  });

export const getBlockHistoryApi = (
  pageUrl: string,
  parsedContent: string
): Promise<BlockHistory | null> =>
  new Promise((resolve) => {
    const key = storageKey(pageUrl, parsedContent);
    chrome.storage.local.get(key, (result) =>
      resolve(hydrateHistory(result[key], pageUrl, parsedContent))
    );
  });

export const saveBlockHistoryApi = (history: BlockHistory): Promise<void> =>
  new Promise((resolve) => {
    const key = storageKey(history.pageUrl, history.parsedContent);
    chrome.storage.local.set({ [key]: history }, resolve);
  });

export const deleteBlockHistoryApi = (pageUrl: string, parsedContent: string): Promise<void> =>
  new Promise((resolve) => {
    chrome.storage.local.remove(storageKey(pageUrl, parsedContent), resolve);
  });

/**
 * Returns all histories for a given pageUrl.
 * Only scans keys with the 'trans:' prefix to skip unrelated storage entries.
 */
export const getAllHistoriesApi = (pageUrl: string): Promise<BlockHistory[]> =>
  getTransEntries((_, h) => h.pageUrl === pageUrl).then(({ histories }) => histories);

/**
 * Deletes all histories for a given pageUrl.
 */
export const clearPageHistoriesApi = (pageUrl: string): Promise<void> =>
  getTransEntries((_, h) => h.pageUrl === pageUrl).then(
    ({ keys }) =>
      new Promise((resolve) => {
        if (!keys.length) {
          resolve();
          return;
        }
        chrome.storage.local.remove(keys, resolve);
      })
  );

/**
 * Deletes all histories across all pages.
 */
export const clearAllHistoriesApi = (): Promise<void> =>
  getTransEntries(() => true).then(
    ({ keys }) =>
      new Promise((resolve) => {
        if (!keys.length) {
          resolve();
          return;
        }
        chrome.storage.local.remove(keys, resolve);
      })
  );

/**
 * Notifies listener when any history entry changes.
 */
export const subscribeHistoryChangesApi = (
  listener: (pageUrl: string, parsedContent: string, history: BlockHistory | null) => void
): (() => void) => {
  const handler = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area !== 'local') return;
    for (const change of Object.values(changes)) {
      const next = change.newValue as BlockHistory | undefined;
      const prev = change.oldValue as BlockHistory | undefined;
      const h = next ?? prev;
      if (!h?.pageUrl || !h?.parsedContent) continue;
      listener(h.pageUrl, h.parsedContent, next ?? null);
    }
  };
  chrome.storage.onChanged.addListener(handler);
  return () => chrome.storage.onChanged.removeListener(handler);
};
