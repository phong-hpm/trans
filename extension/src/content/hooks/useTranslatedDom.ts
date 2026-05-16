// useTranslatedDom.ts — Applies, restores, and rehydrates translated DOM segments

import type { MutableRefObject } from 'react';
import { useCallback } from 'react';

import { getSegmentSelector } from '../../constants/dom';
import type { PlatformBlock } from '../../platforms/types';
import type { TranslationEntry } from '../../types';
import type { TranslatedSegment } from '../../types';
import { PlatformDomTextMutator } from '../dom/PlatformDomTextMutator';
import { useTargetElements } from './useTargetElements';

interface Params {
  platformBlock: PlatformBlock;
  segmentsRef: MutableRefObject<TranslatedSegment[] | null>;
}

interface Result {
  restoreSegments: () => void;
  applyFromEntry: (entry: TranslationEntry, elements: HTMLElement[]) => void;
  applyToLiveElement: (translated: TranslatedSegment[]) => void;
}

export const useTranslatedDom = ({ platformBlock, segmentsRef }: Params): Result => {
  const getTargetElements = useTargetElements(platformBlock);

  const restoreSegments = useCallback(() => {
    const segments = segmentsRef.current;
    if (!segments) return;
    const segmenter = new PlatformDomTextMutator(getTargetElements());
    segmenter.restore(segments);
  }, [segmentsRef, getTargetElements]);

  const applyFromEntry = useCallback(
    (entry: TranslationEntry, elements: HTMLElement[]) => {
      if (!segmentsRef.current) return;
      const map = new Map(entry.segments.map((segment) => [segment.text, segment.translatedText]));
      const updated = segmentsRef.current.map((segment) => ({
        ...segment,
        translatedText: map.get(segment.text) ?? segment.text,
      }));
      segmentsRef.current = updated;
      const segmenter = new PlatformDomTextMutator(elements);
      segmenter.apply(updated);
    },
    [segmentsRef]
  );

  const applyToLiveElement = useCallback(
    (translated: TranslatedSegment[]): void => {
      const currentElements = getTargetElements();
      const spansPresent = translated.every((segment) =>
        currentElements.some((element) => element.querySelector(getSegmentSelector(segment.id)))
      );

      const segmenter = new PlatformDomTextMutator(currentElements);

      if (spansPresent) {
        segmentsRef.current = translated;
        segmenter.apply(translated);
        return;
      }

      const map = new Map(translated.map((segment) => [segment.text, segment.translatedText]));
      const raw = segmenter.extractAndMark();
      if (!raw.length) return;

      const rehydrated = raw.map((segment) => ({
        ...segment,
        translatedText: map.get(segment.text) ?? segment.text,
      }));
      segmentsRef.current = rehydrated;
      segmenter.apply(rehydrated);
    },
    [segmentsRef, getTargetElements]
  );

  return { restoreSegments, applyFromEntry, applyToLiveElement };
};
