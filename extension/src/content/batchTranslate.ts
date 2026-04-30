// batchTranslate.ts — Collects all blocks, sends one batch request, saves results to history

import { MessageTypeEnum } from '../enums';
import type { Block } from '../platforms/types';
import { useGlobalStore } from '../store/global';
import type { BatchTranslateResponse } from '../types';
import { getParsedContentDom } from './dom/injectDom';
import { extractSegmentsDom } from './dom/segmentsDom';
import { addTranslationEntry } from './translationSync';

/**
 * Translates all blocks in a single LLM call via the background service worker.
 *
 * Flow:
 *   1. Extract DOM segments from each block.
 *   2. Send one BackgroundBatchTranslateMessage to the background worker.
 *   3. Background POSTs to /translate/batch — one LLM call for all segments.
 *   4. Save each block's result to the history store.
 *   5. Dispatch trans:translate-all — each block's translate() reads from history
 *      and applies the translation without calling the API again.
 *
 * Returns the number of blocks that were sent for translation (0 if nothing to do).
 */
export const batchTranslateAll = async (blocks: Block[]): Promise<number> => {
  const { targetLanguage, provider, model, userContext } = useGlobalStore.getState();

  // Extract segments and parsedContent for each block
  type PreparedBlock = {
    parsedContent: string;
    segments: { id: string; text: string }[];
    contextBlocks: ReturnType<NonNullable<Block['getContextBlocks']>>;
    blockType: Block['blockType'];
    // id→text map for result reconstruction
    idToText: Map<string, string>;
  };

  const prepared: PreparedBlock[] = [];
  for (const block of blocks) {
    const parsedContent = getParsedContentDom(block.contentEl);
    if (!parsedContent) continue;

    const rawSegments = extractSegmentsDom(block.contentEl);
    if (!rawSegments.length) continue;

    prepared.push({
      parsedContent,
      segments: rawSegments.map(({ id, text }) => ({ id, text })),
      contextBlocks: block.getContextBlocks?.() ?? [],
      blockType: block.blockType,
      idToText: new Map(rawSegments.map((s) => [s.id, s.text])),
    });
  }

  if (!prepared.length) return 0;

  const result = (await chrome.runtime.sendMessage({
    type: MessageTypeEnum.BatchTranslate,
    blocks: prepared.map(({ blockType, segments, contextBlocks }) => ({
      blockType,
      segments,
      contextBlocks,
    })),
    targetLanguage,
    provider,
    model,
    userContext: userContext || undefined,
  })) as
    | { success: true; blocks: BatchTranslateResponse['blocks'] }
    | { success: false; error: string };

  if (!result) throw new Error('No response from background worker');
  if (!result.success) throw new Error(result.error);

  // Save each block's result to history store
  await Promise.all(
    result.blocks.map((blockResult, i) => {
      const { parsedContent, idToText } = prepared[i];
      const translatedSegments = blockResult.segments.map((s) => ({
        text: idToText.get(s.id) ?? s.text,
        translatedText: s.translatedText,
      }));
      return addTranslationEntry(parsedContent, translatedSegments);
    })
  );

  return prepared.length;
};
