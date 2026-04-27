// translationSync.ts — Coordinator: wraps useHistoryStore and optionally syncs to backend DB
// Use this module (not useHistoryStore directly) from hooks and components.
// DB sync is fire-and-forget — local operations never fail due to DB unavailability.

import { deleteBlockHistoryDbApi, saveBlockHistoryDbApi } from '../apis/dbHistoryApi';
import { useGlobalStore } from '../store/global';
import { useHistoryStore } from '../store/history';
import type { BlockHistory } from '../types';

const isSyncEnabled = (): boolean => useGlobalStore.getState().syncToDb;

const syncSave = (history: BlockHistory): void => {
  if (!isSyncEnabled()) return;
  saveBlockHistoryDbApi(history).catch(() => {});
};

const syncDelete = (blockId: string, pageId: string): void => {
  if (!isSyncEnabled()) return;
  deleteBlockHistoryDbApi(blockId, pageId).catch(() => {});
};

/**
 * Returns the history for a block on the current page, or null.
 */
export const getBlockHistory = (blockId: string) =>
  useHistoryStore.getState().getBlockHistory(blockId);

/**
 * Returns the currently selected entry for a block, or null.
 */
export const getSelectedEntry = (blockId: string) =>
  useHistoryStore.getState().getSelectedEntry(blockId);

/**
 * Adds a new translation entry and optionally syncs to DB.
 */
export const addTranslationEntry = async (
  blockId: string,
  segments: { text: string; translatedText: string }[]
): Promise<BlockHistory> => {
  const history = await useHistoryStore.getState().addEntry(blockId, segments);
  syncSave(history);
  return history;
};

/**
 * Selects a history entry and optionally syncs to DB.
 */
export const selectEntry = async (blockId: string, entryId: string): Promise<void> => {
  await useHistoryStore.getState().selectEntry(blockId, entryId);
  const history = useHistoryStore.getState().getBlockHistory(blockId);
  if (history) syncSave(history);
};

/**
 * Deletes a history entry; syncs deletion to DB if block history is fully removed.
 */
export const deleteEntry = async (blockId: string, entryId: string): Promise<void> => {
  const pageId = useHistoryStore.getState().pageId;
  if (!pageId) return;
  await useHistoryStore.getState().deleteEntry(blockId, entryId);
  const remaining = useHistoryStore.getState().getBlockHistory(blockId);
  if (remaining) {
    syncSave(remaining);
  } else {
    syncDelete(blockId, pageId);
  }
};
