// providers/openai/prompt.ts — System prompt for OpenAI GPT models
import { buildBatchSharedPrompt, buildSharedPrompt } from '@/providers/shared/prompt';

export const buildPrompt = (targetLanguage: string, userContext?: string): string =>
  buildSharedPrompt(targetLanguage, userContext);

export const buildBatchPrompt = (targetLanguage: string, userContext?: string): string =>
  buildBatchSharedPrompt(targetLanguage, userContext);
