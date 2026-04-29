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
import { clearActiveTranslations } from '../content/activeTranslations';
import type { BlockHistory, TranslationEntry } from '../types';
import { normalizePageUrl } from '../utils/url';

interface HistoryStore {
  pageUrl: string | null;
  histories: BlockHistory[];

  /**
   * Loads all histories for the given pageUrl into the store and subscribes to storage changes.
   * Call once per page context (content script init).
   */
  init: (pageUrl: string) => Promise<void>;

  /**
   * Returns the history for a block by parsedContent, or null if not found.
   */
  getBlockHistory: (parsedContent: string) => BlockHistory | null;

  /**
   * Returns the currently selected entry for a block, or null.
   */
  getSelectedEntry: (parsedContent: string) => TranslationEntry | null;

  /**
   * Adds a new translation entry for a block (auto-selected, others deselected).
   * Persists to storage and returns the updated history.
   */
  addEntry: (
    parsedContent: string,
    segments: { text: string; translatedText: string }[]
  ) => Promise<BlockHistory>;

  /**
   * Selects a specific entry for a block (deselects others). Persists to storage.
   */
  selectEntry: (parsedContent: string, entryId: string) => Promise<void>;

  /**
   * Deletes a specific entry. If no entries remain, deletes the block history entirely.
   */
  deleteEntry: (parsedContent: string, entryId: string) => Promise<void>;

  /**
   * Deletes all entries for a given block.
   */
  deleteBlockHistory: (parsedContent: string) => Promise<void>;

  /**
   * Clears all histories for the current page.
   */
  clearPage: () => Promise<void>;

  /**
   * Clears all histories across all pages.
   */
  clearAll: () => Promise<void>;
}

export const useHistoryStore = create<HistoryStore>((set, get) => {
  // Holds the cleanup fn for the active storage subscription — lives in the store closure
  // so re-init (Turbo soft navigation) can tear down the previous one without module-level state
  let storageUnsub: (() => void) | null = null;

  return {
    pageUrl: null,
    histories: [],

    init: async (rawPageUrl) => {
      // Tear down previous subscription (Turbo / soft navigation re-init)
      storageUnsub?.();
      storageUnsub = null;

      // Clear in-memory active translation tracking for the previous page
      clearActiveTranslations();

      const pageUrl = normalizePageUrl(rawPageUrl);
      const histories = await getAllHistoriesApi(pageUrl);
      set({ pageUrl, histories });

      // Stay in sync with storage changes from other contexts (e.g. sidebar in another tab)
      storageUnsub = subscribeHistoryChangesApi((changedPageUrl, parsedContent, history) => {
        if (changedPageUrl !== pageUrl) return;
        set((s) => {
          const filtered = s.histories.filter((h) => h.parsedContent !== parsedContent);
          return { histories: history ? [...filtered, history] : filtered };
        });
      });
    },

    getBlockHistory: (parsedContent) =>
      get().histories.find((h) => h.parsedContent === parsedContent) ?? null,

    getSelectedEntry: (parsedContent) =>
      get()
        .getBlockHistory(parsedContent)
        ?.entries.find((e) => e.selected) ?? null,

    addEntry: async (parsedContent, segments) => {
      const { pageUrl } = get();
      if (!pageUrl) throw new Error('[HistoryStore] store not initialized');

      const existing = await getBlockHistoryApi(pageUrl, parsedContent);
      const prevEntries = existing?.entries ?? [];

      const newEntry: TranslationEntry = {
        id: nanoid(8),
        segments,
        createdAt: Date.now(),
        selected: true,
      };

      const entries: TranslationEntry[] = [
        newEntry,
        ...prevEntries.map((e) => ({ ...e, selected: false })),
      ];

      const history: BlockHistory = {
        id: existing?.id ?? nanoid(8),
        pageUrl,
        parsedContent,
        entries,
      };

      await saveBlockHistoryApi(history);
      set((s) => ({
        histories: [...s.histories.filter((h) => h.parsedContent !== parsedContent), history],
      }));

      return history;
    },

    selectEntry: async (parsedContent, entryId) => {
      const { pageUrl } = get();
      if (!pageUrl) return;

      const existing = await getBlockHistoryApi(pageUrl, parsedContent);
      if (!existing) return;

      const history: BlockHistory = {
        ...existing,
        entries: existing.entries.map((e) => ({ ...e, selected: e.id === entryId })),
      };

      await saveBlockHistoryApi(history);
      set((s) => ({
        histories: [...s.histories.filter((h) => h.parsedContent !== parsedContent), history],
      }));
    },

    deleteEntry: async (parsedContent, entryId) => {
      const { pageUrl } = get();
      if (!pageUrl) return;

      const existing = await getBlockHistoryApi(pageUrl, parsedContent);
      if (!existing) return;

      const wasSelected = existing.entries.find((e) => e.id === entryId)?.selected ?? false;
      const remaining = existing.entries.filter((e) => e.id !== entryId);

      if (!remaining.length) {
        await deleteBlockHistoryApi(pageUrl, parsedContent);
        set((s) => ({ histories: s.histories.filter((h) => h.parsedContent !== parsedContent) }));
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
        histories: [...s.histories.filter((h) => h.parsedContent !== parsedContent), history],
      }));
    },

    deleteBlockHistory: async (parsedContent) => {
      const { pageUrl } = get();
      if (!pageUrl) return;
      await deleteBlockHistoryApi(pageUrl, parsedContent);
      set((s) => ({ histories: s.histories.filter((h) => h.parsedContent !== parsedContent) }));
    },

    clearPage: async () => {
      const { pageUrl } = get();
      if (!pageUrl) return;
      await clearPageHistoriesApi(pageUrl);
      set({ histories: [] });
    },

    clearAll: async () => {
      await clearAllHistoriesApi();
      set({ histories: [] });
    },
  };
});
