// dbHistoryApi.ts — REST API calls to backend for translation history sync
// Mirrors historyApi.ts but targets the backend database instead of chrome.storage.local

import type { BlockHistory } from '../types';
import { buildUrlApi, callApi } from '../utils/api';

type ApiResponse<T> = { data: T };

/**
 * Returns the block history for the given blockId and pageId, or null if not found
 */
export const getBlockHistoryDbApi = async (
  blockId: string,
  pageId: string
): Promise<BlockHistory | null> => {
  const { data } = await callApi<ApiResponse<BlockHistory[]>>(
    buildUrlApi('history', { pageId, blockId })
  );
  return data[0] ?? null;
};

/**
 * Saves a block history to the backend
 */
export const saveBlockHistoryDbApi = async (history: BlockHistory): Promise<void> => {
  await callApi(buildUrlApi('history'), {
    method: 'POST',
    body: { pageId: history.pageId, blockId: history.blockId, entries: history.entries },
  });
};

/**
 * Deletes the history for the given blockId and pageId
 */
export const deleteBlockHistoryDbApi = async (blockId: string, pageId: string): Promise<void> => {
  await callApi(buildUrlApi('history', { pageId, blockId }), { method: 'DELETE' });
};

/**
 * Returns all block histories for the given pageId
 */
export const getAllHistoriesDbApi = async (pageId: string): Promise<BlockHistory[]> => {
  const { data } = await callApi<ApiResponse<BlockHistory[]>>(buildUrlApi('history', { pageId }));
  return data;
};

/**
 * Deletes all histories for the given pageId
 */
export const clearPageHistoriesDbApi = async (pageId: string): Promise<void> => {
  await callApi(buildUrlApi('history', { pageId }), { method: 'DELETE' });
};

/**
 * Deletes all histories across all pages
 */
export const clearAllHistoriesDbApi = async (): Promise<void> => {
  await callApi(buildUrlApi('history'), { method: 'DELETE' });
};
