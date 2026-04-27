// store/history.ts — Zustand store for page translation history; single source of truth for history data

import { nanoid } from 'nanoid';
import { create } from 'zustand';

import {
  clearAllHistoriesApi,
  clearPageHistoriesApi,
  deleteBlockHistoryApi,
  getAllHistoriesApi,
  getBlockHistoryApi,
  saveBlockHistoryApi,
  subscribeHistoryChangesApi,
} from '../apis/historyApi';
import type { BlockHistory, TranslationEntry } from '../types';

interface HistoryStore {
  pageId: string | null;
  histories: BlockHistory[];

  /**
   * Loads all histories for the given page into the store and subscribes to storage changes.
   * Call once per page context (content script init).
   */
  init: (pageId: string) => Promise<void>;

  /**
   * Returns the history for a block, or null if not found.
   */
  getBlockHistory: (blockId: string) => BlockHistory | null;

  /**
   * Returns the currently selected entry for a block, or null.
   */
  getSelectedEntry: (blockId: string) => TranslationEntry | null;

  /**
   * Adds a new translation entry for a block (auto-selected, others deselected).
   * Persists to storage and returns the updated history.
   */
  addEntry: (
    blockId: string,
    segments: { text: string; translatedText: string }[]
  ) => Promise<BlockHistory>;

  /**
   * Selects a specific entry for a block (deselects others). Persists to storage.
   */
  selectEntry: (blockId: string, entryId: string) => Promise<void>;

  /**
   * Deletes a specific entry. If no entries remain, deletes the block history entirely.
   */
  deleteEntry: (blockId: string, entryId: string) => Promise<void>;

  /**
   * Deletes all entries for a given block.
   */
  deleteBlockHistory: (blockId: string) => Promise<void>;

  /**
   * Clears all histories for the current page.
   */
  clearPage: () => Promise<void>;

  /**
   * Clears all histories across all pages.
   */
  clearAll: () => Promise<void>;
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  pageId: null,
  histories: [],

  init: async (pageId) => {
    const histories = await getAllHistoriesApi(pageId);
    set({ pageId, histories });

    // Stay in sync with storage changes from other contexts (e.g. sidebar in another tab)
    subscribeHistoryChangesApi((blockId, changedPageId, history) => {
      if (changedPageId !== pageId) return;
      set((s) => {
        const filtered = s.histories.filter((h) => h.blockId !== blockId);
        return { histories: history ? [...filtered, history] : filtered };
      });
    });
  },

  getBlockHistory: (blockId) => get().histories.find((h) => h.blockId === blockId) ?? null,

  getSelectedEntry: (blockId) =>
    get()
      .getBlockHistory(blockId)
      ?.entries.find((e) => e.selected) ?? null,

  addEntry: async (blockId, segments) => {
    const { pageId } = get();
    if (!pageId) throw new Error('[HistoryStore] store not initialized');

    const existing = await getBlockHistoryApi(blockId, pageId);
    const prevEntries = existing?.entries ?? [];

    const newEntry: TranslationEntry = {
      id: nanoid(8),
      blockId,
      pageId,
      segments,
      createdAt: Date.now(),
      selected: true,
    };

    const entries: TranslationEntry[] = [
      newEntry,
      ...prevEntries.map((e) => ({ ...e, selected: false })),
    ];

    const history: BlockHistory = { blockId, pageId, entries };
    await saveBlockHistoryApi(history);

    set((s) => ({
      histories: [...s.histories.filter((h) => h.blockId !== blockId), history],
    }));

    return history;
  },

  selectEntry: async (blockId, entryId) => {
    const { pageId } = get();
    if (!pageId) return;

    const existing = await getBlockHistoryApi(blockId, pageId);
    if (!existing) return;

    const history: BlockHistory = {
      ...existing,
      entries: existing.entries.map((e) => ({ ...e, selected: e.id === entryId })),
    };

    await saveBlockHistoryApi(history);

    set((s) => ({
      histories: [...s.histories.filter((h) => h.blockId !== blockId), history],
    }));
  },

  deleteEntry: async (blockId, entryId) => {
    const { pageId } = get();
    if (!pageId) return;

    const existing = await getBlockHistoryApi(blockId, pageId);
    if (!existing) return;

    const wasSelected = existing.entries.find((e) => e.id === entryId)?.selected ?? false;
    const remaining = existing.entries.filter((e) => e.id !== entryId);

    if (!remaining.length) {
      await deleteBlockHistoryApi(blockId, pageId);
      set((s) => ({ histories: s.histories.filter((h) => h.blockId !== blockId) }));
      return;
    }

    let entries = remaining;
    if (wasSelected) {
      const newestIdx = entries.reduce(
        (best, e, idx) => (e.createdAt > entries[best].createdAt ? idx : best),
        0
      );
      entries = entries.map((e, idx) => ({ ...e, selected: idx === newestIdx }));
    }

    const history: BlockHistory = { ...existing, entries };
    await saveBlockHistoryApi(history);

    set((s) => ({
      histories: [...s.histories.filter((h) => h.blockId !== blockId), history],
    }));
  },

  deleteBlockHistory: async (blockId) => {
    const { pageId } = get();
    if (!pageId) return;
    await deleteBlockHistoryApi(blockId, pageId);
    set((s) => ({ histories: s.histories.filter((h) => h.blockId !== blockId) }));
  },

  clearPage: async () => {
    const { pageId } = get();
    if (!pageId) return;
    await clearPageHistoriesApi(pageId);
    set({ histories: [] });
  },

  clearAll: async () => {
    await clearAllHistoriesApi();
    set({ histories: [] });
  },
}));
