// controllers/history.controller.ts — Handles history CRUD requests

import type { Request, Response } from 'express';

import * as historyService from '@/services/history.service';

type HistoryScope =
  | { scope: 'block'; pageUrl: string; parsedContent: string }
  | { scope: 'page'; pageUrl: string }
  | { scope: 'all' };

// Resolves which history scope applies based on query params
const resolveHistoryScope = (query: { pageUrl?: string; parsedContent?: string }): HistoryScope => {
  if (query.pageUrl && query.parsedContent) {
    return { scope: 'block', pageUrl: query.pageUrl, parsedContent: query.parsedContent };
  }
  if (query.pageUrl) {
    return { scope: 'page', pageUrl: query.pageUrl };
  }
  return { scope: 'all' };
};

/**
 * Returns { data: BlockHistory[] }, filterable by ?pageUrl and ?parsedContent
 */
export const getHistories = (req: Request, res: Response): void => {
  const query = req.query as { pageUrl?: string; parsedContent?: string };
  const scope = resolveHistoryScope(query);

  if (scope.scope === 'block') {
    const history = historyService.getBlockHistory(scope);
    res.json({ data: history ? [history] : [] });
    return;
  }

  if (scope.scope === 'page') {
    res.json({ data: historyService.getPageHistories(scope) });
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
  const query = req.query as { pageUrl?: string; parsedContent?: string };
  const scope = resolveHistoryScope(query);

  if (scope.scope === 'block') {
    historyService.deleteBlockHistory(scope);
    res.status(200).json({ data: null });
    return;
  }

  if (scope.scope === 'page') {
    historyService.clearPageHistories(scope);
    res.status(200).json({ data: null });
    return;
  }

  historyService.clearAllHistories();
  res.status(200).json({ data: null });
};
