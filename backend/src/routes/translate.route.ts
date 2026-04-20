// translate.route.ts — Route definitions for translation endpoints

import { Router } from 'express';
import { translateController } from '../controllers/translate.controller';

const router = Router();

router.post('/', translateController);

export default router;
