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

const syncDelete = (parsedContent: string, pageUrl: string): void => {
  if (!isSyncEnabled()) return;
  deleteBlockHistoryDbApi(parsedContent, pageUrl).catch(() => {});
};

/**
 * Returns the history for a block on the current page, or null.
 */
export const getBlockHistory = (parsedContent: string) =>
  useHistoryStore.getState().getBlockHistory(parsedContent);

/**
 * Returns the currently selected entry for a block, or null.
 */
export const getSelectedEntry = (parsedContent: string) =>
  useHistoryStore.getState().getSelectedEntry(parsedContent);

/**
 * Adds a new translation entry and optionally syncs to DB.
 */
export const addTranslationEntry = async (
  parsedContent: string,
  segments: { text: string; translatedText: string }[]
): Promise<BlockHistory> => {
  const history = await useHistoryStore.getState().addEntry(parsedContent, segments);
  syncSave(history);
  return history;
};

/**
 * Selects a history entry and optionally syncs to DB.
 */
export const selectEntry = async (parsedContent: string, entryId: string): Promise<void> => {
  await useHistoryStore.getState().selectEntry(parsedContent, entryId);
  const history = useHistoryStore.getState().getBlockHistory(parsedContent);
  if (history) syncSave(history);
};

/**
 * Deletes a history entry; syncs deletion to DB if block history is fully removed.
 */
export const deleteEntry = async (parsedContent: string, entryId: string): Promise<void> => {
  const pageUrl = useHistoryStore.getState().pageUrl;
  if (!pageUrl) return;
  await useHistoryStore.getState().deleteEntry(parsedContent, entryId);
  const remaining = useHistoryStore.getState().getBlockHistory(parsedContent);
  if (remaining) {
    syncSave(remaining);
  } else {
    syncDelete(parsedContent, pageUrl);
  }
};
