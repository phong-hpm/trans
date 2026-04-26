// historyApi.ts — Repository for block translation histories; chrome.storage.local is the backing store

import type { BlockHistory } from '../types';

// Internal: derives storage key from entity identity
const storageKey = (pageId: string, blockId: string): string => `trans:${pageId}:${blockId}`;

// Internal: parses a storage key back to entity identity fields
const parseStorageKey = (key: string): { pageId: string; blockId: string } | null => {
  if (!key.startsWith('trans:')) return null;
  const rest = key.slice('trans:'.length);
  const colonIdx = rest.indexOf(':');
  if (colonIdx === -1) return null;
  return { pageId: rest.slice(0, colonIdx), blockId: rest.slice(colonIdx + 1) };
};

// Internal: type guard + backfills identity fields missing from old storage format
const hydrateHistory = (value: unknown, blockId: string, pageId: string): BlockHistory | null => {
  if (typeof value !== 'object' || value === null) return null;
  if (!Array.isArray((value as BlockHistory).entries)) return null;
  return { ...(value as BlockHistory), blockId, pageId };
};

export const getBlockHistoryApi = (blockId: string, pageId: string): Promise<BlockHistory | null> =>
  new Promise((resolve) => {
    const key = storageKey(pageId, blockId);
    chrome.storage.local.get(key, (result) =>
      resolve(hydrateHistory(result[key], blockId, pageId))
    );
  });

export const saveBlockHistoryApi = (history: BlockHistory): Promise<void> =>
  new Promise((resolve) => {
    const key = storageKey(history.pageId, history.blockId);
    chrome.storage.local.set({ [key]: history }, resolve);
  });

export const deleteBlockHistoryApi = (blockId: string, pageId: string): Promise<void> =>
  new Promise((resolve) => {
    chrome.storage.local.remove(storageKey(pageId, blockId), resolve);
  });

// Returns all histories for a given page, backfilling identity fields if missing
export const getAllHistoriesApi = (pageId: string): Promise<BlockHistory[]> =>
  new Promise((resolve) => {
    chrome.storage.local.get(null, (all) => {
      const histories: BlockHistory[] = [];
      for (const [key, value] of Object.entries(all)) {
        const parsed = parseStorageKey(key);
        if (!parsed || parsed.pageId !== pageId) continue;
        const history = hydrateHistory(value, parsed.blockId, parsed.pageId);
        if (history) histories.push(history);
      }
      resolve(histories);
    });
  });

// Deletes all histories for a given page
export const clearPageHistoriesApi = (pageId: string): Promise<void> =>
  new Promise((resolve) => {
    chrome.storage.local.get(null, (all) => {
      const keys = Object.keys(all).filter((k) => parseStorageKey(k)?.pageId === pageId);
      if (!keys.length) {
        resolve();
        return;
      }
      chrome.storage.local.remove(keys, resolve);
    });
  });

// Deletes all histories across all pages
export const clearAllHistoriesApi = (): Promise<void> =>
  new Promise((resolve) => {
    chrome.storage.local.get(null, (all) => {
      const keys = Object.keys(all).filter((k) => k.startsWith('trans:'));
      if (!keys.length) {
        resolve();
        return;
      }
      chrome.storage.local.remove(keys, resolve);
    });
  });

// Notifies listener with typed entity identity + new value (null = deleted)
export const subscribeHistoryChangesApi = (
  listener: (blockId: string, pageId: string, history: BlockHistory | null) => void
): (() => void) => {
  const handler = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area !== 'local') return;
    for (const [key, change] of Object.entries(changes)) {
      const parsed = parseStorageKey(key);
      if (!parsed) continue;
      const history = hydrateHistory(change.newValue, parsed.blockId, parsed.pageId);
      listener(parsed.blockId, parsed.pageId, history);
    }
  };
  chrome.storage.onChanged.addListener(handler);
  return () => chrome.storage.onChanged.removeListener(handler);
};
