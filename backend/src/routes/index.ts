// index.ts — Root router: mounts versioned API routes

import { Router } from 'express';

import historyRoutes from '@/routes/v1/history.route';
import translateRoutes from '@/routes/v1/translate.route';

const router = Router();

router.use('/v1', translateRoutes);
router.use('/v1/history', historyRoutes);

export default router;
