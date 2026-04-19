// index.ts — Provider registry

import type { TranslationProvider } from '@/providers/types';
import { openaiProvider } from '@/providers/openai';
import { geminiProvider } from '@/providers/gemini';

const providers: Record<string, TranslationProvider> = {
  openai: openaiProvider,
  gemini: geminiProvider,
};

export const getProvider = (name: string): TranslationProvider => {
  const provider = providers[name];
  if (!provider) throw new Error(`Unknown provider "${name}". Supported: ${Object.keys(providers).join(', ')}`);
  return provider;
};
