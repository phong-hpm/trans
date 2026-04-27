// historyApi.ts — Repository for block translation histories; chrome.storage.local is the backing store

import type { BlockHistory } from '../types';

/**
 * Normalizes a URL to origin + pathname only (strips query string and hash).
 */
export const normalizePageUrl = (url: string): string => {
  try {
    const u = new URL(url);
    return u.origin + u.pathname;
  } catch {
    return url;
  }
};

// Internal: derives storage key from pageUrl + parsedContent hash
const storageKey = (pageUrl: string, parsedContent: string): string => {
  // Simple djb2 hash — fast, no crypto needed for a storage key
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
 * Iterates all keys and matches by stored pageUrl field.
 */
export const getAllHistoriesApi = (pageUrl: string): Promise<BlockHistory[]> =>
  new Promise((resolve) => {
    chrome.storage.local.get(null, (all) => {
      const histories: BlockHistory[] = [];
      for (const value of Object.values(all)) {
        if (typeof value !== 'object' || value === null) continue;
        const h = value as BlockHistory;
        if (!Array.isArray(h.entries) || h.pageUrl !== pageUrl) continue;
        histories.push(h);
      }
      resolve(histories);
    });
  });

/**
 * Deletes all histories for a given pageUrl.
 */
export const clearPageHistoriesApi = (pageUrl: string): Promise<void> =>
  new Promise((resolve) => {
    chrome.storage.local.get(null, (all) => {
      const keys = Object.entries(all)
        .filter(
          ([, v]) => typeof v === 'object' && v !== null && (v as BlockHistory).pageUrl === pageUrl
        )
        .map(([k]) => k);
      if (!keys.length) {
        resolve();
        return;
      }
      chrome.storage.local.remove(keys, resolve);
    });
  });

/**
 * Deletes all histories across all pages.
 */
export const clearAllHistoriesApi = (): Promise<void> =>
  new Promise((resolve) => {
    chrome.storage.local.get(null, (all) => {
      const keys = Object.entries(all)
        .filter(
          ([, v]) =>
            typeof v === 'object' && v !== null && Array.isArray((v as BlockHistory).entries)
        )
        .map(([k]) => k);
      if (!keys.length) {
        resolve();
        return;
      }
      chrome.storage.local.remove(keys, resolve);
    });
  });

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
