// translationSync.ts — Coordinator: wraps translationHistory.ts and optionally syncs to backend DB
// Use this module (not translationHistory.ts) from hooks and components.
// DB sync is fire-and-forget — local operations never fail due to DB unavailability.

import { deleteBlockHistoryDbApi, saveBlockHistoryDbApi } from '../apis/dbHistoryApi';
import { useGlobalStore } from '../store/global';
import type { BlockHistory } from '../types';
import type { TranslatedSegment } from './domSegments';
import {
  addTranslationEntry as localAddEntry,
  deleteEntry as localDeleteEntry,
  getBlockHistory,
  getSelectedEntry,
  selectEntry as localSelectEntry,
} from './translationHistory';

// Re-export read-only operations directly — they only read from local storage
export { getBlockHistory, getSelectedEntry };

const isSyncEnabled = (): boolean => useGlobalStore.getState().syncToDb;

const syncSave = (history: BlockHistory): void => {
  if (!isSyncEnabled()) return;
  saveBlockHistoryDbApi(history).catch(() => {
    // DB sync failure is non-fatal; local storage is the source of truth
  });
};

const syncDelete = (blockId: string, pageId: string): void => {
  if (!isSyncEnabled()) return;
  deleteBlockHistoryDbApi(blockId, pageId).catch(() => {});
};

// Add a new translation entry and optionally sync to DB
export const addTranslationEntry = async (
  blockId: string,
  segments: TranslatedSegment[]
): Promise<BlockHistory> => {
  const history = await localAddEntry(blockId, segments);
  syncSave(history);
  return history;
};

// Select a history entry and optionally sync the updated state to DB
export const selectEntry = async (blockId: string, entryId: string): Promise<void> => {
  const history = await localSelectEntry(blockId, entryId);
  if (history) syncSave(history);
};

// Delete a history entry; if all entries removed, delete from DB too
export const deleteEntry = async (blockId: string, entryId: string): Promise<void> => {
  const pageId = location.pathname;
  const history = await localDeleteEntry(blockId, entryId);
  if (history) {
    syncSave(history);
  } else {
    syncDelete(blockId, pageId);
  }
};
