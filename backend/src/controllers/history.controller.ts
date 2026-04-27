// controllers/history.controller.ts — Handles history CRUD requests

import type { Request, Response } from 'express';

import * as historyService from '@/services/history.service';

/**
 * Returns { data: BlockHistory[] }, filterable by ?pageId and ?blockId
 */
export const getHistories = (req: Request, res: Response): void => {
  const { pageId, blockId } = req.query as { pageId?: string; blockId?: string };

  if (pageId && blockId) {
    const history = historyService.getBlockHistory({ blockId, pageId });
    res.json({ data: history ? [history] : [] });
    return;
  }

  if (pageId) {
    res.json({ data: historyService.getPageHistories({ pageId }) });
    return;
  }

  res.json({ data: historyService.getAllHistories() });
};

/**
 * Saves a block history. Body: { pageId, blockId, entries }
 */
export const saveBlockHistory = (req: Request, res: Response): void => {
  const { pageId, blockId, entries } = req.body as {
    pageId?: string;
    blockId?: string;
    entries?: unknown[];
  };

  if (!pageId || !blockId) {
    res.status(400).json({ error: 'pageId and blockId are required' });
    return;
  }

  if (!Array.isArray(entries)) {
    res.status(400).json({ error: 'entries array is required' });
    return;
  }

  historyService.saveBlockHistory({
    history: {
      blockId,
      pageId,
      entries: entries as historyService.BlockHistory['entries'],
    },
  });

  res.status(200).json({ data: null });
};

/**
 * Deletes histories, filterable by ?pageId and ?blockId
 */
export const deleteHistories = (req: Request, res: Response): void => {
  const { pageId, blockId } = req.query as { pageId?: string; blockId?: string };

  if (pageId && blockId) {
    historyService.deleteBlockHistory({ blockId, pageId });
    res.status(200).json({ data: null });
    return;
  }

  if (pageId) {
    historyService.clearPageHistories({ pageId });
    res.status(200).json({ data: null });
    return;
  }

  historyService.clearAllHistories();
  res.status(200).json({ data: null });
};
