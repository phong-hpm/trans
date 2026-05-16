// useReapplyTranslationOnBlockDomChange.ts — Re-applies active translations after host page DOM replacement

import type { MutableRefObject } from 'react';
import { useEffect } from 'react';

import { getSegmentSelector } from '../../constants/dom';
import { TranslateStateEnum } from '../../enums';
import type { PlatformBlock } from '../../platforms/types';
import type { TranslatedSegment } from '../../types';
import { TranslatableBlock } from '../block/TranslatableBlock';
import { PlatformDomTextMutator } from '../dom/PlatformDomTextMutator';
import { useTargetElements } from './useTargetElements';

interface Params {
  platformBlock: PlatformBlock;
  stateRef: MutableRefObject<TranslateStateEnum>;
  segmentsRef: MutableRefObject<TranslatedSegment[] | null>;
}

export const useReapplyTranslationOnBlockDomChange = ({
  platformBlock,
  stateRef,
  segmentsRef,
}: Params): void => {
  const getTargetElements = useTargetElements(platformBlock);

  useEffect(() => {
    const containerEl = new TranslatableBlock(platformBlock).containerEl;

    const observer = new MutationObserver(() => {
      if (stateRef.current !== TranslateStateEnum.Translated) return;
      if (!segmentsRef.current?.length) return;

      const liveElements = getTargetElements();
      if (!liveElements.length) return;

      const spansPresent = segmentsRef.current.every((segment) =>
        liveElements.some((element) => element.querySelector(getSegmentSelector(segment.id)))
      );
      if (spansPresent) return;

      const translationMap = new Map(
        segmentsRef.current.map((segment) => [segment.text, segment.translatedText])
      );

      observer.disconnect();

      const segmenter = new PlatformDomTextMutator(liveElements);
      const raw = segmenter.extractAndMark();
      if (raw.length) {
        const rehydrated = raw.map((segment) => ({
          ...segment,
          translatedText: translationMap.get(segment.text) ?? segment.text,
        }));
        segmentsRef.current = rehydrated;
        segmenter.apply(rehydrated);
      }

      observer.observe(containerEl, { childList: true, subtree: true });
    });

    observer.observe(containerEl, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [platformBlock, getTargetElements, stateRef, segmentsRef]);
};
