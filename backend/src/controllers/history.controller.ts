// controllers/history.controller.ts — Handles history CRUD requests

import type { Request, Response } from 'express';

import * as historyService from '@/services/history.service';

/**
 * Returns { data: BlockHistory[] }, filterable by ?pageUrl and ?parsedContent
 */
export const getHistories = (req: Request, res: Response): void => {
  const { pageUrl, parsedContent } = req.query as { pageUrl?: string; parsedContent?: string };

  if (pageUrl && parsedContent) {
    const history = historyService.getBlockHistory({ parsedContent, pageUrl });
    res.json({ data: history ? [history] : [] });
    return;
  }

  if (pageUrl) {
    res.json({ data: historyService.getPageHistories({ pageUrl }) });
    return;
  }

  res.json({ data: historyService.getAllHistories() });
};

/**
 * Saves a block history. Body: { pageUrl, parsedContent, entries }
 */
export const saveBlockHistory = (req: Request, res: Response): void => {
  const { pageUrl, parsedContent, entries } = req.body as {
    pageUrl?: string;
    parsedContent?: string;
    entries?: unknown[];
  };

  if (!pageUrl || !parsedContent) {
    res.status(400).json({ error: 'pageUrl and parsedContent are required' });
    return;
  }

  if (!Array.isArray(entries)) {
    res.status(400).json({ error: 'entries array is required' });
    return;
  }

  historyService.saveBlockHistory({
    history: {
      parsedContent,
      pageUrl,
      entries: entries as historyService.BlockHistory['entries'],
    },
  });

  res.status(200).json({ data: null });
};

/**
 * Deletes histories, filterable by ?pageUrl and ?parsedContent
 */
export const deleteHistories = (req: Request, res: Response): void => {
  const { pageUrl, parsedContent } = req.query as { pageUrl?: string; parsedContent?: string };

  if (pageUrl && parsedContent) {
    historyService.deleteBlockHistory({ parsedContent, pageUrl });
    res.status(200).json({ data: null });
    return;
  }

  if (pageUrl) {
    historyService.clearPageHistories({ pageUrl });
    res.status(200).json({ data: null });
    return;
  }

  historyService.clearAllHistories();
  res.status(200).json({ data: null });
};
