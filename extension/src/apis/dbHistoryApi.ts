// dbHistoryApi.ts — REST API calls to backend for translation history sync
// Mirrors historyApi.ts but targets the backend database instead of chrome.storage.local

import ENV from '../constants/env';
import type { BlockHistory } from '../types';

// pageId is a URL pathname (e.g. "/owner/repo/issues/1") — must be encoded in URL segments
const historyUrl = (pageId: string, blockId?: string): string => {
  const encodedPage = encodeURIComponent(pageId);
  const base = `${ENV.backendUrl}/history/${encodedPage}`;
  return blockId ? `${base}/${encodeURIComponent(blockId)}` : base;
};

export const getBlockHistoryDbApi = async (
  blockId: string,
  pageId: string
): Promise<BlockHistory | null> => {
  const res = await fetch(historyUrl(pageId, blockId));
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`[db] getBlockHistory failed: ${res.status}`);
  return res.json() as Promise<BlockHistory>;
};

export const saveBlockHistoryDbApi = async (history: BlockHistory): Promise<void> => {
  const res = await fetch(historyUrl(history.pageId, history.blockId), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entries: history.entries }),
  });
  if (!res.ok) throw new Error(`[db] saveBlockHistory failed: ${res.status}`);
};

export const deleteBlockHistoryDbApi = async (blockId: string, pageId: string): Promise<void> => {
  const res = await fetch(historyUrl(pageId, blockId), { method: 'DELETE' });
  if (!res.ok) throw new Error(`[db] deleteBlockHistory failed: ${res.status}`);
};

export const getAllHistoriesDbApi = async (pageId: string): Promise<BlockHistory[]> => {
  const res = await fetch(historyUrl(pageId));
  if (!res.ok) throw new Error(`[db] getAllHistories failed: ${res.status}`);
  return res.json() as Promise<BlockHistory[]>;
};

export const clearPageHistoriesDbApi = async (pageId: string): Promise<void> => {
  const res = await fetch(historyUrl(pageId), { method: 'DELETE' });
  if (!res.ok) throw new Error(`[db] clearPageHistories failed: ${res.status}`);
};

export const clearAllHistoriesDbApi = async (): Promise<void> => {
  const res = await fetch(`${ENV.backendUrl}/history`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`[db] clearAllHistories failed: ${res.status}`);
};
