// translationCache.ts — Persist translated segments in chrome.storage.local keyed by URL + blockId

import type { TranslatedSegment } from './domSegments';

interface CacheEntry {
  segments: { text: string; translatedText: string }[];
}

const cacheKey = (blockId: string): string => `trans:${location.pathname}:${blockId}`;

export const getCached = (blockId: string): Promise<CacheEntry | null> =>
  new Promise((resolve) => {
    const key = cacheKey(blockId);
    chrome.storage.local.get(key, (result) => {
      resolve((result[key] as CacheEntry) ?? null);
    });
  });

export const setCached = (blockId: string, segments: TranslatedSegment[]): Promise<void> =>
  new Promise((resolve) => {
    const entry: CacheEntry = {
      segments: segments.map(({ text, translatedText }) => ({ text, translatedText })),
    };
    chrome.storage.local.set({ [cacheKey(blockId)]: entry }, resolve);
  });

export const clearPageCache = (pathname: string): Promise<void> =>
  new Promise((resolve) => {
    const prefix = `trans:${pathname}:`;
    chrome.storage.local.get(null, (all) => {
      const keys = Object.keys(all).filter((k) => k.startsWith(prefix));
      if (!keys.length) return resolve();
      chrome.storage.local.remove(keys, resolve);
    });
  });
