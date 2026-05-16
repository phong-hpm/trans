// useTranslationHistorySync.ts — Syncs a block toolbar with translation history store changes

import type { MutableRefObject } from 'react';
import { useEffect } from 'react';

import { TranslateStateEnum } from '../../enums';
import type { PlatformBlock } from '../../platforms/types';
import { useHistoryStore } from '../../store/history';
import type { TranslationEntry } from '../../types';
import { isActive } from '../activeTranslations';
import { TranslatableBlock } from '../block/TranslatableBlock';
import type { TranslatedSegment } from '../dom/segmentsDom';
import { useTargetElements } from './useTargetElements';

interface Params {
  platformBlock: PlatformBlock;
  setHistory: (entries: TranslationEntry[]) => void;
  stateRef: MutableRefObject<TranslateStateEnum>;
  segmentsRef: MutableRefObject<TranslatedSegment[] | null>;
  translateRef: MutableRefObject<() => Promise<void>>;
  restoreRef: MutableRefObject<() => void>;
  applyFromEntry: (entry: TranslationEntry, elements: HTMLElement[]) => void;
}

export const useTranslationHistorySync = ({
  platformBlock,
  setHistory,
  stateRef,
  segmentsRef,
  translateRef,
  restoreRef,
  applyFromEntry,
}: Params): void => {
  const parsedContent = new TranslatableBlock(platformBlock).parsedContent;
  const { getBlockHistory } = useHistoryStore();
  const getTargetElements = useTargetElements(platformBlock);

  useEffect(() => {
    const hist = getBlockHistory(parsedContent);
    if (hist?.entries.length) {
      setHistory(hist.entries);
      if (isActive(parsedContent)) {
        translateRef.current();
      }
    }
  }, [getBlockHistory, parsedContent, setHistory, translateRef]);

  useEffect(() => {
    return useHistoryStore.subscribe((state) => {
      const hist = state.histories.find((h) => h.parsedContent === parsedContent);

      if (!hist?.entries?.length) {
        setHistory([]);
        if (stateRef.current === TranslateStateEnum.Translated) restoreRef.current();
        return;
      }

      setHistory(hist.entries);

      const selected = hist.entries.find((entry) => entry.selected);
      if (selected && stateRef.current === TranslateStateEnum.Translated && segmentsRef.current) {
        applyFromEntry(selected, getTargetElements());
      }
    });
  }, [
    parsedContent,
    setHistory,
    stateRef,
    segmentsRef,
    restoreRef,
    applyFromEntry,
    getTargetElements,
  ]);
};
