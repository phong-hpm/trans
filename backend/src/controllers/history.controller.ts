// controllers/history.controller.ts — Handles history CRUD requests

import type { Request, Response } from 'express';

import * as historyService from '@/services/history.service';

// GET /history/:pageId/:blockId
export const getBlockHistory = (req: Request, res: Response): void => {
  const { pageId, blockId } = req.params as { pageId: string; blockId: string };
  const history = historyService.getBlockHistory({ blockId, pageId });
  if (!history) {
    res.status(404).json({ error: 'History not found' });
    return;
  }
  res.json(history);
};

// GET /history/:pageId
export const getPageHistories = (req: Request, res: Response): void => {
  const { pageId } = req.params as { pageId: string };
  res.json(historyService.getPageHistories({ pageId }));
};

// GET /history
export const getAllHistories = (_req: Request, res: Response): void => {
  res.json(historyService.getAllHistories());
};

// PUT /history/:pageId/:blockId
export const saveBlockHistory = (req: Request, res: Response): void => {
  const { pageId, blockId } = req.params as { pageId: string; blockId: string };
  const { entries } = req.body as { entries?: unknown[] };

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

  res.status(200).json({ ok: true });
};

// DELETE /history/:pageId/:blockId
export const deleteBlockHistory = (req: Request, res: Response): void => {
  const { pageId, blockId } = req.params as { pageId: string; blockId: string };
  historyService.deleteBlockHistory({ blockId, pageId });
  res.status(200).json({ ok: true });
};

// DELETE /history/:pageId
export const clearPageHistories = (req: Request, res: Response): void => {
  const { pageId } = req.params as { pageId: string };
  historyService.clearPageHistories({ pageId });
  res.status(200).json({ ok: true });
};

// DELETE /history
export const clearAllHistories = (_req: Request, res: Response): void => {
  historyService.clearAllHistories();
  res.status(200).json({ ok: true });
};
