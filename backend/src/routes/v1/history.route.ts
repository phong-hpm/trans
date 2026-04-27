// routes/v1/history.route.ts — REST endpoints for translation history

import { Router } from 'express';

import {
  deleteHistories,
  getHistories,
  saveBlockHistory,
} from '@/controllers/history.controller';

const router = Router();

/**
 * Returns { data: BlockHistory[] }, filterable by ?pageUrl and ?parsedContent
 */
router.get('/', getHistories);

/**
 * Saves a block history. Body: { pageUrl, parsedContent, entries }
 */
router.post('/', saveBlockHistory);

/**
 * Deletes histories, filterable by ?pageUrl and ?parsedContent
 */
router.delete('/', deleteHistories);

export default router;
