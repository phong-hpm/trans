// translate.route.ts — v1 translate endpoint

import { Router } from 'express';
import { translateController } from '@/controllers/translate.controller';

const router = Router();

router.post('/translate', translateController);

export default router;
