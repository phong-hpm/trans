// useBlockHistories.ts — Load and subscribe to all block histories for the current page

import { useEffect, useState } from 'react';
import type { BlockHistory } from '../../types';

export interface BlockHistoryItem {
  blockId: string;
  history: BlockHistory;
  preview: string;
  lastTranslatedAt: number;
}

const PAGE_PREFIX = `trans:${location.pathname}:`;

const isValidHistory = (value: unknown): value is BlockHistory =>
  typeof value === 'object' && value !== null && Array.isArray((value as BlockHistory).entries);

const buildItems = (all: Record<string, unknown>): BlockHistoryItem[] => {
  const items: BlockHistoryItem[] = [];

  for (const [key, value] of Object.entries(all)) {
    if (!key.startsWith(PAGE_PREFIX)) continue;
    if (!isValidHistory(value) || !value.entries.length) continue;

    const blockId = key.slice(PAGE_PREFIX.length);
    // Most recent entry = highest createdAt
    const mostRecent = value.entries.reduce((best, e) => (e.createdAt > best.createdAt ? e : best), value.entries[0]);
    const preview = mostRecent.segments.map((s) => s.text).join(' ');

    items.push({
      blockId,
      history: value,
      preview,
      lastTranslatedAt: mostRecent.createdAt,
    });
  }

  // Sort most recently translated first
  return items.sort((a, b) => b.lastTranslatedAt - a.lastTranslatedAt);
};

export const useBlockHistories = (): BlockHistoryItem[] => {
  const [items, setItems] = useState<BlockHistoryItem[]>([]);

  // Load all histories on mount
  useEffect(() => {
    chrome.storage.local.get(null, (all) => {
      setItems(buildItems(all as Record<string, unknown>));
    });
  }, []);

  // Subscribe to changes and reload
  useEffect(() => {
    const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area !== 'local') return;
      // Only react if at least one changed key is for this page
      const relevant = Object.keys(changes).some((k) => k.startsWith(PAGE_PREFIX));
      if (!relevant) return;

      chrome.storage.local.get(null, (all) => {
        setItems(buildItems(all as Record<string, unknown>));
      });
    };

    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  return items;
};
