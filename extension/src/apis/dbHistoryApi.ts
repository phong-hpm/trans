// dbHistoryApi.ts — REST API calls to backend for translation history sync
// Mirrors historyApi.ts but targets the backend database instead of chrome.storage.local
//
// All GET and DELETE requests use query filters (?pageId=X&blockId=Y).
// Responses are always { data: BlockHistory[] }; single-block fetches take data[0].

import type { BlockHistory } from '../types';
import { buildUrlApi } from '../utils/api';

type ApiResponse<T> = { data: T };

// GET /history?pageId=X&blockId=Y → { data: BlockHistory[] } — returns the matching block or null
export const getBlockHistoryDbApi = async (
  blockId: string,
  pageId: string
): Promise<BlockHistory | null> => {
  const res = await fetch(buildUrlApi('history', { pageId, blockId }));
  if (!res.ok) throw new Error(`[db] getBlockHistory failed: ${res.status}`);
  const { data } = (await res.json()) as ApiResponse<BlockHistory[]>;
  return data[0] ?? null;
};

// PUT /history — upsert a block history (pageId, blockId, entries in body)
export const saveBlockHistoryDbApi = async (history: BlockHistory): Promise<void> => {
  const res = await fetch(buildUrlApi('history'), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pageId: history.pageId,
      blockId: history.blockId,
      entries: history.entries,
    }),
  });
  if (!res.ok) throw new Error(`[db] saveBlockHistory failed: ${res.status}`);
};

// DELETE /history?pageId=X&blockId=Y
export const deleteBlockHistoryDbApi = async (blockId: string, pageId: string): Promise<void> => {
  const res = await fetch(buildUrlApi('history', { pageId, blockId }), { method: 'DELETE' });
  if (!res.ok) throw new Error(`[db] deleteBlockHistory failed: ${res.status}`);
};

// GET /history?pageId=X → { data: BlockHistory[] }
export const getAllHistoriesDbApi = async (pageId: string): Promise<BlockHistory[]> => {
  const res = await fetch(buildUrlApi('history', { pageId }));
  if (!res.ok) throw new Error(`[db] getAllHistories failed: ${res.status}`);
  const { data } = (await res.json()) as ApiResponse<BlockHistory[]>;
  return data;
};

// DELETE /history?pageId=X
export const clearPageHistoriesDbApi = async (pageId: string): Promise<void> => {
  const res = await fetch(buildUrlApi('history', { pageId }), { method: 'DELETE' });
  if (!res.ok) throw new Error(`[db] clearPageHistories failed: ${res.status}`);
};

// DELETE /history
export const clearAllHistoriesDbApi = async (): Promise<void> => {
  const res = await fetch(buildUrlApi('history'), { method: 'DELETE' });
  if (!res.ok) throw new Error(`[db] clearAllHistories failed: ${res.status}`);
};
