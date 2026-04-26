// translationCache.ts — Persist block translation histories in chrome.storage.local keyed by URL + blockId

import { nanoid } from 'nanoid';
import type { BlockHistory, TranslationEntry } from '../types';
import type { TranslatedSegment } from './domSegments';

export const cacheKey = (blockId: string): string => `trans:${location.pathname}:${blockId}`;

// Get full history for a block, returns null if not found or in old format
export const getBlockHistory = (blockId: string): Promise<BlockHistory | null> =>
  new Promise((resolve) => {
    const key = cacheKey(blockId);
    chrome.storage.local.get(key, (result) => {
      const value = result[key];
      // Gracefully handle old cache format (no .entries array)
      if (!value || !Array.isArray(value.entries)) {
        resolve(null);
        return;
      }
      resolve(value as BlockHistory);
    });
  });

// Add a new translation entry (auto-selected, others deselected). Returns updated history.
export const addTranslationEntry = (blockId: string, segments: TranslatedSegment[]): Promise<BlockHistory> =>
  new Promise((resolve) => {
    const key = cacheKey(blockId);
    chrome.storage.local.get(key, (result) => {
      const value = result[key];
      const existing: TranslationEntry[] =
        value && Array.isArray(value.entries) ? value.entries : [];

      const newEntry: TranslationEntry = {
        id: nanoid(8),
        segments: segments.map(({ text, translatedText }) => ({ text, translatedText })),
        createdAt: Date.now(),
        selected: true,
      };

      // Deselect all existing entries
      const updated: TranslationEntry[] = existing.map((e) => ({ ...e, selected: false }));
      updated.unshift(newEntry);

      const history: BlockHistory = { entries: updated };
      chrome.storage.local.set({ [key]: history }, () => resolve(history));
    });
  });

// Select a specific entry (deselect others). Returns updated history or null if not found.
export const selectEntry = (blockId: string, entryId: string): Promise<BlockHistory | null> =>
  new Promise((resolve) => {
    const key = cacheKey(blockId);
    chrome.storage.local.get(key, (result) => {
      const value = result[key];
      if (!value || !Array.isArray(value.entries)) {
        resolve(null);
        return;
      }

      const entries: TranslationEntry[] = (value as BlockHistory).entries.map((e) => ({
        ...e,
        selected: e.id === entryId,
      }));

      const history: BlockHistory = { entries };
      chrome.storage.local.set({ [key]: history }, () => resolve(history));
    });
  });

// Delete an entry. If it was selected, auto-select newest remaining. Returns updated history (null if empty).
export const deleteEntry = (blockId: string, entryId: string): Promise<BlockHistory | null> =>
  new Promise((resolve) => {
    const key = cacheKey(blockId);
    chrome.storage.local.get(key, (result) => {
      const value = result[key];
      if (!value || !Array.isArray(value.entries)) {
        resolve(null);
        return;
      }

      const existing: TranslationEntry[] = (value as BlockHistory).entries;
      const removed = existing.find((e) => e.id === entryId);
      const remaining = existing.filter((e) => e.id !== entryId);

      if (!remaining.length) {
        chrome.storage.local.remove(key, () => resolve(null));
        return;
      }

      // If removed entry was selected, auto-select the newest remaining entry
      let entries = remaining;
      if (removed?.selected) {
        const newestIdx = entries.reduce(
          (bestIdx, e, idx) => (e.createdAt > entries[bestIdx].createdAt ? idx : bestIdx),
          0,
        );
        entries = entries.map((e, idx) => ({ ...e, selected: idx === newestIdx }));
      }

      const history: BlockHistory = { entries };
      chrome.storage.local.set({ [key]: history }, () => resolve(history));
    });
  });

// Get the currently selected entry for a block
export const getSelectedEntry = (blockId: string): Promise<TranslationEntry | null> =>
  getBlockHistory(blockId).then((hist) => hist?.entries.find((e) => e.selected) ?? null);

// Remove all cached translations for a given pathname (used by popup)
export const clearPageCache = (pathname: string): Promise<void> =>
  new Promise((resolve) => {
    const prefix = `trans:${pathname}:`;
    chrome.storage.local.get(null, (all) => {
      const keys = Object.keys(all).filter((k) => k.startsWith(prefix));
      if (!keys.length) return resolve();
      chrome.storage.local.remove(keys, resolve);
    });
  });
