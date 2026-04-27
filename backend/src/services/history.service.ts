// services/history.service.ts — Business logic for translation history CRUD
// Converts between API-facing BlockHistory shape and internal HistoryDocument

import type { HistoryDocument } from '@/models/history.model';
import * as repo from '@/repositories/history.repository';

/**
 * BlockHistory is the shape the extension and API use directly
 */
export interface BlockHistory {
  parsedContent: string;
  pageUrl: string;
  entries: {
    id: string;
    segments: { text: string; translatedText: string }[];
    createdAt: number;
    selected: boolean;
  }[];
}

const toDocument = (history: BlockHistory): HistoryDocument => ({
  _id: `${history.pageUrl}:::${history.parsedContent}`,
  parsedContent: history.parsedContent,
  pageUrl: history.pageUrl,
  entries: history.entries,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const fromDocument = (doc: HistoryDocument): BlockHistory => ({
  parsedContent: doc.parsedContent,
  pageUrl: doc.pageUrl,
  entries: doc.entries,
});

export const getBlockHistory = ({
  parsedContent,
  pageUrl,
}: {
  parsedContent: string;
  pageUrl: string;
}): BlockHistory | null => {
  const doc = repo.findBlockHistory({ parsedContent, pageUrl });
  return doc ? fromDocument(doc) : null;
};

export const getPageHistories = ({ pageUrl }: { pageUrl: string }): BlockHistory[] =>
  repo.findPageHistories({ pageUrl }).map(fromDocument);

export const getAllHistories = (): BlockHistory[] =>
  repo.findAllHistories().map(fromDocument);

export const saveBlockHistory = ({ history }: { history: BlockHistory }): void => {
  const existing = repo.findBlockHistory({ parsedContent: history.parsedContent, pageUrl: history.pageUrl });
  const doc: HistoryDocument = {
    ...toDocument(history),
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
  repo.upsertBlockHistory({ doc });
};

export const deleteBlockHistory = ({
  parsedContent,
  pageUrl,
}: {
  parsedContent: string;
  pageUrl: string;
}): void => repo.deleteBlockHistory({ parsedContent, pageUrl });

export const clearPageHistories = ({ pageUrl }: { pageUrl: string }): void =>
  repo.deletePageHistories({ pageUrl });

export const clearAllHistories = (): void => repo.deleteAllHistories();
