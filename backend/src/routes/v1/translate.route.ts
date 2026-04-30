// translate.route.ts — v1 translate endpoints: single-block and batch

import { Router } from 'express';
import { translateBatchController, translateController } from '@/controllers/translate.controller';

const router = Router();

router.post('/translate', translateController);
router.post('/translate/batch', translateBatchController);

export default router;
