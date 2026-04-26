// repositories/history.repository.ts — Data access layer for history documents
// All DB interaction goes through historyCollection; service layer never touches the collection directly

import { historyCollection } from '@/db/collections/history.collection';
import type { HistoryDocument } from '@/models/history.model';

const makeId = (pageId: string, blockId: string): string => `${pageId}:::${blockId}`;

export const findBlockHistory = ({
  blockId,
  pageId,
}: {
  blockId: string;
  pageId: string;
}): HistoryDocument | null => historyCollection.findOne({ blockId, pageId });

export const findPageHistories = ({ pageId }: { pageId: string }): HistoryDocument[] =>
  historyCollection.find({ pageId });

export const findAllHistories = (): HistoryDocument[] => historyCollection.find();

export const upsertBlockHistory = ({ doc }: { doc: HistoryDocument }): void => {
  historyCollection.replaceOne(
    { blockId: doc.blockId, pageId: doc.pageId },
    { ...doc, _id: doc._id || makeId(doc.pageId, doc.blockId) },
    { upsert: true }
  );
};

export const deleteBlockHistory = ({
  blockId,
  pageId,
}: {
  blockId: string;
  pageId: string;
}): void => historyCollection.deleteOne({ blockId, pageId });

export const deletePageHistories = ({ pageId }: { pageId: string }): void =>
  historyCollection.deleteMany({ pageId });

export const deleteAllHistories = (): void => historyCollection.deleteMany();
