// translationCache.ts — Block translation history operations for the current page

import { nanoid } from 'nanoid';

import { deleteBlockHistoryApi, getBlockHistoryApi, saveBlockHistoryApi } from '../apis/historyApi';
import type { BlockHistory, TranslationEntry } from '../types';
import type { TranslatedSegment } from './domSegments';

// Internal: page identity for all operations in this content script
const currentPageId = (): string => location.pathname;

// Get full history for a block on the current page
export const getBlockHistory = (blockId: string): Promise<BlockHistory | null> =>
  getBlockHistoryApi(blockId, currentPageId());

// Add a new translation entry (auto-selected, others deselected). Returns updated history.
export const addTranslationEntry = async (
  blockId: string,
  segments: TranslatedSegment[]
): Promise<BlockHistory> => {
  const pageId = currentPageId();
  const existing = await getBlockHistoryApi(blockId, pageId);
  const prevEntries: TranslationEntry[] =
    existing && Array.isArray(existing.entries) ? existing.entries : [];

  const newEntry: TranslationEntry = {
    id: nanoid(8),
    blockId,
    pageId,
    segments: segments.map(({ text, translatedText }) => ({ text, translatedText })),
    createdAt: Date.now(),
    selected: true,
  };

  const updated: TranslationEntry[] = prevEntries.map((e) => ({ ...e, selected: false }));
  updated.unshift(newEntry);

  const history: BlockHistory = { blockId, pageId, entries: updated };
  await saveBlockHistoryApi(history);
  return history;
};

// Select a specific entry (deselect others). Returns updated history or null if not found.
export const selectEntry = async (
  blockId: string,
  entryId: string
): Promise<BlockHistory | null> => {
  const pageId = currentPageId();
  const existing = await getBlockHistoryApi(blockId, pageId);
  if (!existing || !Array.isArray(existing.entries)) return null;

  const entries = existing.entries.map((e) => ({ ...e, selected: e.id === entryId }));
  const history: BlockHistory = { ...existing, entries };
  await saveBlockHistoryApi(history);
  return history;
};

// Delete an entry. If it was selected, auto-select newest remaining. Returns updated history (null if empty).
export const deleteEntry = async (
  blockId: string,
  entryId: string
): Promise<BlockHistory | null> => {
  const pageId = currentPageId();
  const existing = await getBlockHistoryApi(blockId, pageId);
  if (!existing || !Array.isArray(existing.entries)) return null;

  const removed = existing.entries.find((e) => e.id === entryId);
  const remaining = existing.entries.filter((e) => e.id !== entryId);

  if (!remaining.length) {
    await deleteBlockHistoryApi(blockId, pageId);
    return null;
  }

  let entries = remaining;
  if (removed?.selected) {
    const newestIdx = entries.reduce(
      (bestIdx, e, idx) => (e.createdAt > entries[bestIdx].createdAt ? idx : bestIdx),
      0
    );
    entries = entries.map((e, idx) => ({ ...e, selected: idx === newestIdx }));
  }

  const history: BlockHistory = { ...existing, entries };
  await saveBlockHistoryApi(history);
  return history;
};

// Get the currently selected entry for a block on the current page
export const getSelectedEntry = (blockId: string): Promise<TranslationEntry | null> =>
  getBlockHistory(blockId).then((hist) => hist?.entries.find((e) => e.selected) ?? null);
