// routes/v1/history.route.ts — REST endpoints for translation history

import { Router } from 'express';

import {
  clearAllHistories,
  clearPageHistories,
  deleteBlockHistory,
  getAllHistories,
  getBlockHistory,
  getPageHistories,
  saveBlockHistory,
} from '@/controllers/history.controller';

const router = Router();

// Block-level operations
router.get('/:pageId/:blockId', getBlockHistory);
router.put('/:pageId/:blockId', saveBlockHistory);
router.delete('/:pageId/:blockId', deleteBlockHistory);

// Page-level operations
router.get('/:pageId', getPageHistories);
router.delete('/:pageId', clearPageHistories);

// Global operations
router.get('/', getAllHistories);
router.delete('/', clearAllHistories);

export default router;
