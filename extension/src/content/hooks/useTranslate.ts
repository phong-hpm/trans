// useTranslate.ts — Per-block translation state machine
//
// State machine: Idle → Loading → Translated → Idle (via restore).
// Transitions are tracked in stateRef (always current) and mirrored to uiState (for renders).
//
// segmentsRef is the single owner of translated segment data — it is set once during the
// first translate() call (after DOM extraction) and updated in-place on re-apply / retranslate.
// stateRef + segmentsRef together form the block's runtime translation state; uiState is the
// React mirror used for rendering only.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { TranslateStateEnum } from '../../enums';
import type { PlatformBlock } from '../../platforms/types';
import { useGlobalStore } from '../../store/global';
import { useHistoryStore } from '../../store/history';
import { useTranslationDisplayStore } from '../../store/translationDisplay';
import type { TranslationEntry } from '../../types';
import type { TranslatedSegment } from '../../types';
import { TranslatableBlock } from '../block/TranslatableBlock';
import { PlatformDomTextMutator } from '../dom/PlatformDomTextMutator';
import { addTranslationEntry } from '../translationSync';
import { useReapplyTranslationOnBlockDomChange } from './useReapplyTranslationOnBlockDomChange';
import { useTargetElements } from './useTargetElements';
import { useTranslateApi } from './useTranslateApi';
import { useTranslatedDom } from './useTranslatedDom';
import { useTranslateRuntimeEvents } from './useTranslateRuntimeEvents';
import { useTranslationHistorySync } from './useTranslationHistorySync';

type TranslateState = TranslateStateEnum;

export const useTranslate = (platformBlock: PlatformBlock) => {
  const translatableBlock = useMemo(() => new TranslatableBlock(platformBlock), [platformBlock]);
  const parsedContent = translatableBlock.parsedContent;
  const blockType = translatableBlock.blockType;
  const { settings, ready } = useGlobalStore();
  const { targetLanguage, provider, model, userContext, alwaysShowTranslated, autoTranslateTask } =
    settings;
  const { getBlockHistory, getSelectedEntry } = useHistoryStore();
  const [uiState, setUiState] = useState<TranslateState>(TranslateStateEnum.Idle);
  const [history, setHistory] = useState<TranslationEntry[]>([]);
  // Derived — no separate state needed; history.length > 0 is always equivalent
  const hasTranslation = history.length > 0;
  const stateRef = useRef<TranslateState>(TranslateStateEnum.Idle);
  const segmentsRef = useRef<TranslatedSegment[] | null>(null);
  // Translation mode — stored in a ref so toolbar updates don't trigger re-renders
  // 'full': title + task + all preceding comments (default)
  // 'context': title + task only (filter out comment-type context)
  // 'direct': no context
  const modeRef = useRef<'full' | 'context' | 'direct'>('full');
  // Stable refs — always point to the latest translate/restore without causing re-subscriptions.
  // Effects that call these use no dep array so the ref is updated every render.
  const translateRef = useRef<() => Promise<void>>(async () => {});
  const restoreRef = useRef<() => void>(() => {});

  const getTargetElements = useTargetElements(platformBlock);
  const { restoreSegments, applyFromEntry, applyToLiveElement } = useTranslatedDom({
    platformBlock,
    segmentsRef,
  });
  const getMode = useCallback(() => modeRef.current, []);

  const setState = useCallback(
    (s: TranslateState) => {
      stateRef.current = s;
      setUiState(s);
      if (s === TranslateStateEnum.Translated) {
        useTranslationDisplayStore.getState().showTranslation(parsedContent);
      } else if (s === TranslateStateEnum.Idle) {
        useTranslationDisplayStore.getState().showOriginal(parsedContent);
      }
    },
    [parsedContent]
  );

  const restore = useCallback(() => {
    restoreSegments();
    setState(TranslateStateEnum.Idle);
  }, [restoreSegments, setState]);

  // No dep array — runs every render to keep ref pointing at the latest restore closure
  useEffect(() => {
    restoreRef.current = restore;
  });

  const callApi = useTranslateApi({
    platformBlock,
    targetLanguage,
    provider,
    model,
    userContext,
    getMode,
  });

  const ensureSegmentsExtracted = useCallback((): HTMLElement[] | null => {
    const elements = getTargetElements();
    if (segmentsRef.current) return elements;

    const segmenter = new PlatformDomTextMutator(elements);
    const rawSegments = segmenter.extractAndMark();
    if (!rawSegments.length) return null;

    segmentsRef.current = rawSegments.map((segment) => ({
      ...segment,
      translatedText: segment.text,
    }));
    return elements;
  }, [getTargetElements]);

  const translate = useCallback(async () => {
    if (stateRef.current === TranslateStateEnum.Loading) return;

    // Segments already extracted — re-apply to current live element
    // (handles element replacement since last translation)
    if (segmentsRef.current) {
      applyToLiveElement(segmentsRef.current);
      setState(TranslateStateEnum.Translated);
      return;
    }

    setState(TranslateStateEnum.Loading);

    try {
      const elements = ensureSegmentsExtracted();
      if (!elements || !segmentsRef.current) {
        setState(TranslateStateEnum.Idle);
        return;
      }

      // Check for a selected history entry (synchronous — no async gap, el is still valid)
      const selectedEntry = getSelectedEntry(parsedContent);
      if (selectedEntry) {
        applyFromEntry(selectedEntry, elements);
        setState(TranslateStateEnum.Translated);
        return;
      }

      // No history — call API (async: element may be replaced while waiting)
      const translated = await callApi(segmentsRef.current);

      const updatedHistory = await addTranslationEntry(parsedContent, translated, blockType);
      setHistory(updatedHistory.entries);

      // Apply to current live element — handles replacement that happened during API call
      applyToLiveElement(translated);
      setState(TranslateStateEnum.Translated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Translation failed';
      toast.error(msg);
      setState(TranslateStateEnum.Idle);
    }
  }, [
    setState,
    applyToLiveElement,
    ensureSegmentsExtracted,
    getSelectedEntry,
    parsedContent,
    callApi,
    blockType,
    applyFromEntry,
  ]);

  // No dep array — runs every render to keep ref pointing at the latest translate closure
  useEffect(() => {
    translateRef.current = translate;
  });

  const retranslate = useCallback(async () => {
    if (stateRef.current === TranslateStateEnum.Loading) return;

    if (!ensureSegmentsExtracted() || !segmentsRef.current) return;

    setState(TranslateStateEnum.Loading);

    try {
      const toTranslate = segmentsRef.current.map(({ id, text }) => ({
        id,
        text,
        translatedText: text,
      }));
      const translated = await callApi(toTranslate);

      const updatedHistory = await addTranslationEntry(parsedContent, translated, blockType);
      setHistory(updatedHistory.entries);

      // Apply to current live element — handles replacement during API call
      applyToLiveElement(translated);
      setState(TranslateStateEnum.Translated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Translation failed';
      toast.error(msg);
      setState(TranslateStateEnum.Idle);
    }
  }, [parsedContent, blockType, ensureSegmentsExtracted, setState, callApi, applyToLiveElement]);

  useTranslationHistorySync({
    platformBlock,
    setHistory,
    stateRef,
    segmentsRef,
    translateRef,
    restoreRef,
    applyFromEntry,
  });

  // Auto-apply saved translation when store is ready and alwaysShowTranslated is enabled
  useEffect(() => {
    if (!ready || stateRef.current !== TranslateStateEnum.Idle || !alwaysShowTranslated) return;
    const hist = getBlockHistory(parsedContent);
    if (hist?.entries.length) translateRef.current();
  }, [parsedContent, ready, alwaysShowTranslated, getBlockHistory]);

  // Auto-translate this block on load if autoTranslateTask is enabled:
  // applies from history if available, otherwise calls the API
  useEffect(() => {
    if (!ready || stateRef.current !== TranslateStateEnum.Idle || !autoTranslateTask) return;
    translateRef.current();
  }, [parsedContent, ready, autoTranslateTask]);

  useReapplyTranslationOnBlockDomChange({
    platformBlock,
    stateRef,
    segmentsRef,
  });

  useTranslateRuntimeEvents({
    parsedContent,
    stateRef,
    translateRef,
    restoreRef,
  });

  const setMode = useCallback((mode: 'full' | 'context' | 'direct') => {
    modeRef.current = mode;
  }, []);

  return {
    state: uiState,
    translate,
    retranslate,
    restore,
    hasTranslation,
    history,
    setMode,
  };
};
