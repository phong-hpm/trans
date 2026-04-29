// translate.service.ts — Translation business logic: noise filtering, provider dispatch, segment merge

import { getProvider } from '@/providers';
import type { ContextBlock, TranslateSegment, TranslatedSegment } from '@/types';

interface TranslateParams {
  segments: TranslateSegment[];
  contextBlocks?: ContextBlock[];
  targetLanguage: string;
  provider: string;
  model: string;
  userContext?: string;
}

// Segments matching these patterns are UI/editor noise — skip before sending to LLM
const NOISE_PATTERNS = [
  /^Move\s/i,
  /^Open\s/i,
  /task options/i,
  /To pick up a draggable item/i,
  /While dragging/i,
  /Press space again/i,
];

const filterNoise = (segments: TranslateSegment[]): TranslateSegment[] =>
  segments.filter((s) => {
    const text = s.text.trim();
    if (!text) return false;
    return !NOISE_PATTERNS.some((p) => p.test(text));
  });

export const translateSegments = async ({
  segments,
  contextBlocks,
  targetLanguage,
  provider,
  model,
  userContext,
}: TranslateParams): Promise<TranslatedSegment[]> => {
  const filtered = filterNoise(segments);
  const textMap = new Map(segments.map((s) => [s.id, s.text]));

  const llmProvider = getProvider(provider);
  const results = await llmProvider.translate({
    segments: filtered,
    contextBlocks,
    targetLanguage,
    model,
    userContext,
  });

  return results.map((r) => ({
    id: r.id,
    text: textMap.get(r.id) ?? '',
    translatedText: r.translatedText,
  }));
};
