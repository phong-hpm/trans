// routes/v1/history.route.ts — REST endpoints for translation history

import { Router } from 'express';

import {
  deleteHistories,
  getHistories,
  saveBlockHistory,
} from '@/controllers/history.controller';

const router = Router();

// GET    /history                       — all histories
// GET    /history?pageId=X              — all blocks for a page
// GET    /history?pageId=X&blockId=Y   — single block (returns array of 0 or 1)
router.get('/', getHistories);

// PUT    /history                       — upsert a block history (pageId, blockId, entries in body)
router.put('/', saveBlockHistory);

// DELETE /history                       — delete all
// DELETE /history?pageId=X              — delete all blocks for a page
// DELETE /history?pageId=X&blockId=Y   — delete a specific block
router.delete('/', deleteHistories);

export default router;
