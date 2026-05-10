// useReapplyTranslationOnBlockDomChange.ts — Re-applies active translations after host page DOM replacement

import type { MutableRefObject } from 'react';
import { useEffect } from 'react';

import { getSegmentSelector } from '../../constants/dom';
import { TranslateStateEnum } from '../../enums';
import type { BlockTranslationTarget } from '../../platforms/types';
import type { TranslatedSegment } from '../dom/segmentsDom';
import { applyTranslationDom, extractSegmentsDom } from '../dom/segmentsDom';
import { useTargetElements } from './useTargetElements';

interface Params {
  blockTarget: BlockTranslationTarget;
  stateRef: MutableRefObject<TranslateStateEnum>;
  segmentsRef: MutableRefObject<TranslatedSegment[] | null>;
}

export const useReapplyTranslationOnBlockDomChange = ({
  blockTarget,
  stateRef,
  segmentsRef,
}: Params): void => {
  const getTargetElements = useTargetElements(blockTarget);

  useEffect(() => {
    const containerEl = blockTarget.domAccess.getContainerEl();

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

      const raw = liveElements.flatMap((element) => extractSegmentsDom(element));
      if (raw.length) {
        const rehydrated = raw.map((segment) => ({
          ...segment,
          translatedText: translationMap.get(segment.text) ?? segment.text,
        }));
        segmentsRef.current = rehydrated;
        liveElements.forEach((element) => applyTranslationDom(rehydrated, element));
      }

      observer.observe(containerEl, { childList: true, subtree: true });
    });

    observer.observe(containerEl, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [blockTarget, getTargetElements, stateRef, segmentsRef]);
};
