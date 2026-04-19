// index.ts — Root router: mounts versioned API routes

import { Router } from 'express';
import v1Routes from '@/routes/v1/translate.route';

const router = Router();

router.use('/v1', v1Routes);

export default router;
