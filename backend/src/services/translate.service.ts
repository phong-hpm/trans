// translate.service.ts — Translation business logic: calls provider and merges original text into response

import { getProvider } from '@/providers';
import type { ContextBlock, TranslateSegment, TranslatedSegment } from '@/types';

interface TranslateParams {
  segments: TranslateSegment[];
  contextBlocks?: ContextBlock[];
  targetLanguage: string;
  provider: string;
  model: string;
}

export const translateSegments = async ({ segments, contextBlocks, targetLanguage, provider, model }: TranslateParams): Promise<TranslatedSegment[]> => {
  const textMap = new Map(segments.map((s) => [s.id, s.text]));

  const llmProvider = getProvider(provider);
  const results = await llmProvider.translate({ segments, contextBlocks, targetLanguage, model });

  return results.map((r) => ({
    id: r.id,
    text: textMap.get(r.id) ?? '',
    translatedText: r.translatedText,
  }));
};
