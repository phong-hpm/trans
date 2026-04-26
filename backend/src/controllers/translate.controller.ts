// translate.controller.ts — Handles /translate request validation and response

import type { Request, Response } from 'express';
import { translateSegments } from '@/services/translate.service';
import { logger } from '@/lib/logger';
import type { TranslateRequest } from '@/types';

export const translateController = async (req: Request, res: Response): Promise<void> => {
  const { blockType, segments, contextBlocks, targetLanguage, provider, model, userContext } = req.body as Partial<TranslateRequest>;

  // Model whitelist per provider — configured via env vars, falls back to built-in defaults
  const ALLOWED_MODELS: Record<string, string[]> = {
    openai: (process.env.OPENAI_ALLOWED_MODELS || '').split(',').map((m) => m.trim()),
    gemini: (process.env.GEMINI_ALLOWED_MODELS || '').split(',').map((m) => m.trim()),
  };

  if (!blockType || !segments?.length || !targetLanguage || !provider || !model) {
    res.status(400).json({ error: 'blockType, segments, targetLanguage, provider, and model are required' });
    return;
  }

  const knownProviders = Object.keys(ALLOWED_MODELS);
  if (!knownProviders.includes(provider)) {
    res.status(400).json({ error: `Unknown provider "${provider}". Allowed: ${knownProviders.join(', ')}` });
    return;
  }

  const allowedModels = ALLOWED_MODELS[provider];
  if (!allowedModels.includes(model)) {
    res
      .status(400)
      .json({
        error: `Model "${model}" is not allowed for provider "${provider}". Allowed: ${allowedModels.join(', ')}`,
      });
    return;
  }

  logger.request(req.method, req.path, req.body);

  try {
    const translated = await translateSegments({ segments, contextBlocks, targetLanguage, provider, model, userContext });
    logger.success(req.method, req.path, 200, { segments: translated });
    res.json({ segments: translated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Translation failed';
    logger.error(req.method, req.path, 500, message);
    res.status(500).json({ error: message });
  }
};
