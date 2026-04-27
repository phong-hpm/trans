// routes/v1/history.route.ts — REST endpoints for translation history

import { Router } from 'express';

import {
  deleteHistories,
  getHistories,
  saveBlockHistory,
} from '@/controllers/history.controller';

const router = Router();

/**
 * Returns { data: BlockHistory[] }, filterable by ?pageId and ?blockId
 */
router.get('/', getHistories);

/**
 * Saves a block history. Body: { pageId, blockId, entries }
 */
router.post('/', saveBlockHistory);

/**
 * Deletes histories, filterable by ?pageId and ?blockId
 */
router.delete('/', deleteHistories);

export default router;
