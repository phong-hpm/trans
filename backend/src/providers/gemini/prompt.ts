// providers/gemini/prompt.ts — System prompt for Google Gemini models
import { buildSharedPrompt } from '@/providers/shared/prompt';

export const buildPrompt = (targetLanguage: string, userContext?: string): string =>
  buildSharedPrompt(targetLanguage, userContext);
