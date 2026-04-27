// dbHistoryApi.ts — REST API calls to backend for translation history sync
// Mirrors historyApi.ts but targets the backend database instead of chrome.storage.local

import type { BlockHistory } from '../types';
import { buildUrlApi, callApi } from '../utils/api';

type ApiResponse<T> = { data: T };

/**
 * Returns the block history for the given parsedContent and pageUrl, or null if not found
 */
export const getBlockHistoryDbApi = async (
  parsedContent: string,
  pageUrl: string
): Promise<BlockHistory | null> => {
  const { data } = await callApi<ApiResponse<BlockHistory[]>>(
    buildUrlApi('history', { pageUrl, parsedContent })
  );
  return data[0] ?? null;
};

/**
 * Saves a block history to the backend
 */
export const saveBlockHistoryDbApi = async (history: BlockHistory): Promise<void> => {
  await callApi(buildUrlApi('history'), {
    method: 'POST',
    body: {
      pageUrl: history.pageUrl,
      parsedContent: history.parsedContent,
      entries: history.entries,
    },
  });
};

/**
 * Deletes the history for the given parsedContent and pageUrl
 */
export const deleteBlockHistoryDbApi = async (
  parsedContent: string,
  pageUrl: string
): Promise<void> => {
  await callApi(buildUrlApi('history', { pageUrl, parsedContent }), { method: 'DELETE' });
};

/**
 * Returns all block histories for the given pageUrl
 */
export const getAllHistoriesDbApi = async (pageUrl: string): Promise<BlockHistory[]> => {
  const { data } = await callApi<ApiResponse<BlockHistory[]>>(buildUrlApi('history', { pageUrl }));
  return data;
};

/**
 * Deletes all histories for the given pageUrl
 */
export const clearPageHistoriesDbApi = async (pageUrl: string): Promise<void> => {
  await callApi(buildUrlApi('history', { pageUrl }), { method: 'DELETE' });
};

/**
 * Deletes all histories across all pages
 */
export const clearAllHistoriesDbApi = async (): Promise<void> => {
  await callApi(buildUrlApi('history'), { method: 'DELETE' });
};
