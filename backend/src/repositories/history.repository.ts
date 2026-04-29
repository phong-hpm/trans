// repositories/history.repository.ts — Data access layer for history documents
// All DB interaction goes through historyCollection; service layer never touches the collection directly

import { historyCollection } from '@/db/collections/history.collection';
import type { HistoryDocument } from '@/models/history.model';

export const makeId = (pageUrl: string, parsedContent: string): string =>
  `${pageUrl}:::${parsedContent}`;

export const findBlockHistory = ({
  parsedContent,
  pageUrl,
}: {
  parsedContent: string;
  pageUrl: string;
}): HistoryDocument | null => historyCollection.findOne({ parsedContent, pageUrl });

export const findPageHistories = ({ pageUrl }: { pageUrl: string }): HistoryDocument[] =>
  historyCollection.find({ pageUrl });

export const findAllHistories = (): HistoryDocument[] => historyCollection.find();

export const upsertBlockHistory = ({ doc }: { doc: HistoryDocument }): void => {
  historyCollection.replaceOne(
    { parsedContent: doc.parsedContent, pageUrl: doc.pageUrl },
    { ...doc, _id: doc._id || makeId(doc.pageUrl, doc.parsedContent) },
    { upsert: true }
  );
};

export const deleteBlockHistory = ({
  parsedContent,
  pageUrl,
}: {
  parsedContent: string;
  pageUrl: string;
}): void => historyCollection.deleteOne({ parsedContent, pageUrl });

export const deletePageHistories = ({ pageUrl }: { pageUrl: string }): void =>
  historyCollection.deleteMany({ pageUrl });

export const deleteAllHistories = (): void => historyCollection.deleteMany();
