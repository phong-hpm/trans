// translationSync.ts — Write-only coordinator: wraps useHistoryStore mutations with optional DB sync.
// Use this module for any history write (add, select, delete).
// Pure reads use useHistoryStore.getState() directly — no sync side effects needed.

import { deleteBlockHistoryDbApi, saveBlockHistoryDbApi } from '../apis/dbHistoryApi';
import type { BlockTypeEnum } from '../enums';
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
 * Adds a new translation entry and optionally syncs to DB.
 */
export const addTranslationEntry = async (
  parsedContent: string,
  segments: { text: string; translatedText: string }[],
  blockType?: BlockTypeEnum
): Promise<BlockHistory> => {
  const history = await useHistoryStore.getState().addEntry(parsedContent, segments, blockType);
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
