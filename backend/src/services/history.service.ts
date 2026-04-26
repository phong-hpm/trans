// services/history.service.ts — Business logic for translation history CRUD
// Converts between API-facing BlockHistory shape and internal HistoryDocument

import type { HistoryDocument } from '@/models/history.model';
import * as repo from '@/repositories/history.repository';

// BlockHistory is the shape the extension and API use directly
export interface BlockHistory {
  blockId: string;
  pageId: string;
  entries: {
    id: string;
    segments: { text: string; translatedText: string }[];
    createdAt: number;
    selected: boolean;
  }[];
}

const toDocument = (history: BlockHistory): HistoryDocument => ({
  _id: `${history.pageId}:::${history.blockId}`,
  blockId: history.blockId,
  pageId: history.pageId,
  entries: history.entries,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const fromDocument = (doc: HistoryDocument): BlockHistory => ({
  blockId: doc.blockId,
  pageId: doc.pageId,
  entries: doc.entries,
});

export const getBlockHistory = ({
  blockId,
  pageId,
}: {
  blockId: string;
  pageId: string;
}): BlockHistory | null => {
  const doc = repo.findBlockHistory({ blockId, pageId });
  return doc ? fromDocument(doc) : null;
};

export const getPageHistories = ({ pageId }: { pageId: string }): BlockHistory[] =>
  repo.findPageHistories({ pageId }).map(fromDocument);

export const getAllHistories = (): BlockHistory[] =>
  repo.findAllHistories().map(fromDocument);

export const saveBlockHistory = ({ history }: { history: BlockHistory }): void => {
  const existing = repo.findBlockHistory({ blockId: history.blockId, pageId: history.pageId });
  const doc: HistoryDocument = {
    ...toDocument(history),
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
  repo.upsertBlockHistory({ doc });
};

export const deleteBlockHistory = ({
  blockId,
  pageId,
}: {
  blockId: string;
  pageId: string;
}): void => repo.deleteBlockHistory({ blockId, pageId });

export const clearPageHistories = ({ pageId }: { pageId: string }): void =>
  repo.deletePageHistories({ pageId });

export const clearAllHistories = (): void => repo.deleteAllHistories();
