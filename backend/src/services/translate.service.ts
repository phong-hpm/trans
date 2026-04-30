// translate.service.ts — Translation business logic: noise filtering, provider dispatch, segment merge

import { getProvider } from '@/providers';
import type { BatchBlock, ContextBlock, TranslateSegment, TranslatedSegment } from '@/types';

interface TranslateParams {
  segments: TranslateSegment[];
  contextBlocks?: ContextBlock[];
  targetLanguage: string;
  provider: string;
  model: string;
  userContext?: string;
}

interface TranslateBatchParams {
  blocks: BatchBlock[];
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

export const translateBatchSegments = async ({
  blocks,
  targetLanguage,
  provider,
  model,
  userContext,
}: TranslateBatchParams): Promise<{ segments: TranslatedSegment[] }[]> => {
  // Filter noise per block; build per-block id→text maps for result reconstruction
  const filteredBlocks = blocks.map((b) => ({
    ...b,
    segments: filterNoise(b.segments),
  }));
  const blockTextMaps = blocks.map(
    (b) => new Map(b.segments.map((s) => [s.id, s.text]))
  );

  const llmProvider = getProvider(provider);
  const flatResults = await llmProvider.translateBatch({
    blocks: filteredBlocks,
    targetLanguage,
    model,
    userContext,
  });
  const resultMap = new Map(flatResults.map((r) => [r.id, r.translatedText]));

  // Re-group by block; fall back to original text for any noise-filtered or missing IDs
  return blocks.map((b, i) => ({
    segments: b.segments.map((s) => ({
      id: s.id,
      text: blockTextMaps[i].get(s.id) ?? '',
      translatedText: resultMap.get(s.id) ?? s.text,
    })),
  }));
};

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
