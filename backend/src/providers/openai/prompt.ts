// providers/openai/prompt.ts — System prompt for OpenAI GPT models
import { buildSharedPrompt } from '@/providers/shared/prompt';

export const buildPrompt = (targetLanguage: string, userContext?: string): string =>
  buildSharedPrompt(targetLanguage, userContext);
