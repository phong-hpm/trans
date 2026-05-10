// useTranslateApi.ts — Sends per-block translation requests through the extension background worker

import { useCallback } from 'react';

import { BlockTypeEnum, MessageTypeEnum } from '../../enums';
import type { BlockTranslationTarget } from '../../platforms/types';
import type { TranslatedSegment } from '../dom/segmentsDom';

interface Params {
  blockTarget: BlockTranslationTarget;
  targetLanguage: string;
  provider: string;
  model: string;
  userContext: string;
  getMode: () => 'full' | 'context' | 'direct';
}

export const useTranslateApi = ({
  blockTarget,
  targetLanguage,
  provider,
  model,
  userContext,
  getMode,
}: Params): ((rawSegments: TranslatedSegment[]) => Promise<TranslatedSegment[]>) =>
  useCallback(
    async (rawSegments: TranslatedSegment[]): Promise<TranslatedSegment[]> => {
      const { blockType, domAccess } = blockTarget;
      const allContext = domAccess.getContextBlocks?.() ?? [];
      const mode = getMode();
      const contextBlocks =
        mode === 'direct'
          ? []
          : mode === 'context'
            ? allContext.filter((block) => block.type !== BlockTypeEnum.Comment)
            : allContext;

      const result = await chrome.runtime.sendMessage({
        type: MessageTypeEnum.Translate,
        blockType,
        segments: rawSegments.map(({ id, text }) => ({ id, text })),
        contextBlocks,
        targetLanguage,
        provider,
        model,
        userContext: userContext || undefined,
      });

      if (!result) throw new Error('No response from background worker');
      if (!result.success) throw new Error(result.error);

      return rawSegments.map((segment) => ({
        ...segment,
        translatedText:
          result.segments.find((item: { id: string }) => item.id === segment.id)?.translatedText ??
          segment.text,
      }));
    },
    [blockTarget, targetLanguage, provider, model, userContext, getMode]
  );
