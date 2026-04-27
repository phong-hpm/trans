// db/collections/history.collection.ts — MongoDB-style collection interface backed by db.json
// Swap read/write imports in db/index.ts to connect to real MongoDB

import { read, write } from '@/db';
import type { HistoryDocument } from '@/models/history.model';

type Filter = { parsedContent?: string; pageUrl?: string };

export const historyCollection = {
  /**
   * Find a single document matching parsedContent + pageUrl
   */
  findOne: ({ parsedContent, pageUrl }: Required<Filter>): HistoryDocument | null => {
    const db = read();
    return db.histories.find((h) => h.parsedContent === parsedContent && h.pageUrl === pageUrl) ?? null;
  },

  /**
   * Find all documents, optionally filtered by pageUrl
   */
  find: ({ pageUrl }: Pick<Filter, 'pageUrl'> = {}): HistoryDocument[] => {
    const db = read();
    return pageUrl !== undefined ? db.histories.filter((h) => h.pageUrl === pageUrl) : db.histories;
  },

  /**
   * Insert or replace a document matching the filter (upsert)
   */
  replaceOne: (
    filter: Required<Filter>,
    doc: HistoryDocument,
    options?: { upsert?: boolean }
  ): void => {
    const db = read();
    const idx = db.histories.findIndex(
      (h) => h.parsedContent === filter.parsedContent && h.pageUrl === filter.pageUrl
    );

    if (idx >= 0) {
      db.histories[idx] = doc;
    } else if (options?.upsert) {
      db.histories.push(doc);
    }

    write(db);
  },

  /**
   * Delete the first document matching parsedContent + pageUrl
   */
  deleteOne: ({ parsedContent, pageUrl }: Required<Filter>): void => {
    const db = read();
    db.histories = db.histories.filter(
      (h) => !(h.parsedContent === parsedContent && h.pageUrl === pageUrl)
    );
    write(db);
  },

  /**
   * Delete all documents matching filter; empty filter deletes everything
   */
  deleteMany: ({ pageUrl }: Pick<Filter, 'pageUrl'> = {}): void => {
    const db = read();
    db.histories =
      pageUrl !== undefined ? db.histories.filter((h) => h.pageUrl !== pageUrl) : [];
    write(db);
  },
};
