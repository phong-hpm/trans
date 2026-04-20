// translate.controller.ts — Handles /translate request validation and response

import type { Request, Response } from 'express';
import { translateSegments } from '@/services/translate.service';
import { logger } from '@/lib/logger';
import type { TranslateRequest } from '@/types';

export const translateController = async (req: Request, res: Response): Promise<void> => {
  const { segments, targetLanguage, provider, model } = req.body as Partial<TranslateRequest>;

  if (!segments?.length || !targetLanguage || !provider || !model) {
    res.status(400).json({ error: 'segments, targetLanguage, provider, and model are required' });
    return;
  }

  logger.request(req.method, req.path, req.body);

  try {
    const translated = await translateSegments({ segments, targetLanguage, provider, model });
    logger.success(req.method, req.path, 200, { segments: translated });
    res.json({ segments: translated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Translation failed';
    logger.error(req.method, req.path, 500, message);
    res.status(500).json({ error: message });
  }
};
