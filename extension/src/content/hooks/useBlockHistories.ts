// useBlockHistories.ts — Load and subscribe to all block histories for the current page from useHistoryStore

import { useHistoryStore } from '../../store/history';
import type { BlockHistory } from '../../types';

export interface BlockHistoryItem {
  blockId: string;
  history: BlockHistory;
  preview: string;
  lastTranslatedAt: number;
}

const buildItems = (histories: BlockHistory[]): BlockHistoryItem[] =>
  histories
    .filter((h) => h.entries.length > 0)
    .map((h) => {
      const mostRecent = h.entries.reduce(
        (best, e) => (e.createdAt > best.createdAt ? e : best),
        h.entries[0]
      );
      return {
        blockId: h.blockId,
        history: h,
        preview: mostRecent.segments.map((s) => s.text).join(' '),
        lastTranslatedAt: mostRecent.createdAt,
      };
    })
    .sort((a, b) => b.lastTranslatedAt - a.lastTranslatedAt);

export const useBlockHistories = (): BlockHistoryItem[] => {
  const histories = useHistoryStore((s) => s.histories);
  return buildItems(histories);
};
