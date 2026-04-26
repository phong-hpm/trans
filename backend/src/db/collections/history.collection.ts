// db/collections/history.collection.ts — MongoDB-style collection interface backed by db.json
// Swap read/write imports in db/index.ts to connect to real MongoDB

import { read, write } from '@/db';
import type { HistoryDocument } from '@/models/history.model';

type Filter = { blockId?: string; pageId?: string };

export const historyCollection = {
  // Find a single document matching blockId + pageId
  findOne: ({ blockId, pageId }: Required<Filter>): HistoryDocument | null => {
    const db = read();
    return db.histories.find((h) => h.blockId === blockId && h.pageId === pageId) ?? null;
  },

  // Find all documents, optionally filtered by pageId
  find: ({ pageId }: Pick<Filter, 'pageId'> = {}): HistoryDocument[] => {
    const db = read();
    return pageId !== undefined ? db.histories.filter((h) => h.pageId === pageId) : db.histories;
  },

  // Insert or replace a document (upsert)
  replaceOne: (filter: Required<Filter>, doc: HistoryDocument, options?: { upsert?: boolean }): void => {
    const db = read();
    const idx = db.histories.findIndex(
      (h) => h.blockId === filter.blockId && h.pageId === filter.pageId
    );

    if (idx >= 0) {
      db.histories[idx] = doc;
    } else if (options?.upsert) {
      db.histories.push(doc);
    }

    write(db);
  },

  // Delete a single document
  deleteOne: ({ blockId, pageId }: Required<Filter>): void => {
    const db = read();
    db.histories = db.histories.filter(
      (h) => !(h.blockId === blockId && h.pageId === pageId)
    );
    write(db);
  },

  // Delete all documents matching filter; empty filter deletes everything
  deleteMany: ({ pageId }: Pick<Filter, 'pageId'> = {}): void => {
    const db = read();
    db.histories =
      pageId !== undefined ? db.histories.filter((h) => h.pageId !== pageId) : [];
    write(db);
  },
};
