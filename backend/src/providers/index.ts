// index.ts — Factory that instantiates the configured LLM provider

import { TranslationProvider } from './types';
import { OpenAIProvider } from './openai';
import { GeminiProvider } from './gemini';

type ProviderName = 'openai' | 'gemini';

export const createProvider = (): TranslationProvider => {
  const name = (process.env.LLM_PROVIDER || 'openai').toLowerCase() as ProviderName;

  switch (name) {
    case 'openai':
      return new OpenAIProvider();
    case 'gemini':
      return new GeminiProvider();
    default:
      throw new Error(`Unknown LLM_PROVIDER "${name}". Supported: openai, gemini`);
  }
};
