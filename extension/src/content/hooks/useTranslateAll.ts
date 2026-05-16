// useBatchTranslate.ts — Collects all blocks, sends one batch request, saves results to history

import { useCallback } from 'react';

import { MessageTypeEnum } from '../../enums';
import type { PlatformBlock } from '../../platforms/types';
import { useGlobalStore } from '../../store/global';
import type { BatchTranslateResponse, ContextBlock } from '../../types';
import { PlatformDomTextMutator } from '../dom/PlatformDomTextMutator';
import { PlatformDomTextReader } from '../dom/PlatformDomTextReader';
import { addTranslationEntry } from '../translationSync';

/**
 * Translates all blocks in a single LLM call via the background service worker.
 *
 * Flow:
 *   1. Extract DOM segments from each block.
 *   2. Build one full-page context from every block.
 *   3. Send one BackgroundBatchTranslateMessage to the background worker.
 *   4. Background POSTs to /translate/batch — one LLM call for all segments.
 *   5. Save each block's result to the history store.
 *   6. Dispatch trans:translate-all — each block's translate() reads from history
 *      and applies the translation without calling the API again.
 *
 * Returns the number of blocks that were sent for translation (0 if nothing to do).
 */
export const useTranslateAll = () => {
  const { settings } = useGlobalStore();
  const { targetLanguage, provider, model, userContext } = settings;

  const onTranslateAll = useCallback(
    async (blocks: PlatformBlock[]): Promise<number> => {
      type PreparedBlock = {
        parsedContent: string;
        segments: { id: string; text: string }[];
        blockType: PlatformBlock['blockType'];
        idToText: Map<string, string>;
      };

      const prepared: PreparedBlock[] = [];
      for (const platformBlock of blocks) {
        const livePrimary = platformBlock.getLiveElement?.() ?? platformBlock.contentEl;
        const liveAttached =
          platformBlock.getLiveAttachedElements?.() ?? platformBlock.attachedContentEls ?? [];
        const elements = [...liveAttached, livePrimary].filter(
          (el, index, all): el is HTMLElement => !!el && el.isConnected && all.indexOf(el) === index
        );
        const platformDomTextReader = new PlatformDomTextReader();
        const parsedContent = platformDomTextReader.getParsedText(elements);
        if (!parsedContent) continue;

        const segmenter = new PlatformDomTextMutator(elements);
        const rawSegments = segmenter.extractAndMark();
        if (!rawSegments.length) continue;

        prepared.push({
          parsedContent,
          segments: rawSegments.map(({ id, text }) => ({ id, text })),
          blockType: platformBlock.blockType,
          idToText: new Map(rawSegments.map((s) => [s.id, s.text])),
        });
      }

      if (!prepared.length) return 0;

      const contextBlocks: ContextBlock[] = prepared.map(({ blockType, parsedContent }) => ({
        type: blockType,
        text: parsedContent,
      }));

      const result = (await chrome.runtime.sendMessage({
        type: MessageTypeEnum.BatchTranslate,
        blocks: prepared.map(({ blockType, segments }) => ({ blockType, segments })),
        contextBlocks,
        targetLanguage,
        provider,
        model,
        userContext: userContext || undefined,
      })) as
        | { success: true; blocks: BatchTranslateResponse['blocks'] }
        | { success: false; error: string };

      if (!result) throw new Error('No response from background worker');
      if (!result.success) throw new Error(result.error);

      await Promise.all(
        result.blocks.map((blockResult, i) => {
          const { parsedContent, idToText, blockType } = prepared[i];
          const translatedSegments = blockResult.segments.map((s) => ({
            text: idToText.get(s.id) ?? s.text,
            translatedText: s.translatedText,
          }));
          return addTranslationEntry(parsedContent, translatedSegments, blockType);
        })
      );

      return prepared.length;
    },
    [targetLanguage, provider, model, userContext]
  );

  return { onTranslateAll };
};
