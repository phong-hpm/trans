// useTranslate.ts — Translation state machine with history tracking, DOM segment extraction

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { subscribeHistoryChangesApi } from '../../apis/historyApi';
import ENV from '../../constants/env';
import { type BlockTypeEnum, MessageTypeEnum, TranslateStateEnum } from '../../enums';
import { useGlobalStore } from '../../store/global';
import type { ContextBlock, TranslationEntry } from '../../types';
import type { TranslatedSegment } from '../domSegments';
import { applyTranslation, extractSegments, restoreOriginal } from '../domSegments';
import {
  addTranslationEntry,
  deleteEntry,
  getBlockHistory,
  getSelectedEntry,
  selectEntry,
} from '../translationHistory';

type TranslateState = TranslateStateEnum;

export const useTranslate = (
  blockId: string,
  blockType: BlockTypeEnum,
  getElement: () => HTMLElement,
  getContextBlocks?: () => ContextBlock[]
) => {
  const { targetLanguage, provider, model, userContext, ready, alwaysShowTranslated } =
    useGlobalStore();
  const [uiState, setUiState] = useState<TranslateState>(TranslateStateEnum.Idle);
  const [hasTranslation, setHasTranslation] = useState(false);
  const [history, setHistory] = useState<TranslationEntry[]>([]);
  const stateRef = useRef<TranslateState>(TranslateStateEnum.Idle);
  const segmentsRef = useRef<TranslatedSegment[] | null>(null);
  // Keep stable refs so subscriptions always call the latest version
  const translateRef = useRef<() => Promise<void>>(async () => {});
  const restoreRef = useRef<() => void>(() => {});

  const setState = useCallback((s: TranslateState) => {
    stateRef.current = s;
    setUiState(s);
    if (s === TranslateStateEnum.Translated) setHasTranslation(true);
  }, []);

  const restore = useCallback(() => {
    const segments = segmentsRef.current;
    if (!segments) return;
    restoreOriginal(segments, getElement());
    setState(TranslateStateEnum.Idle);
  }, [getElement, setState]);

  useEffect(() => {
    restoreRef.current = restore;
  });

  const callApi = useCallback(
    async (rawSegments: TranslatedSegment[]): Promise<TranslatedSegment[]> => {
      const contextBlocks = getContextBlocks?.() ?? [];
      const result = await chrome.runtime.sendMessage({
        type: MessageTypeEnum.Translate,
        blockType,
        segments: rawSegments.map(({ id, text }) => ({ id, text })),
        contextBlocks,
        targetLanguage,
        backendUrl: ENV.backendUrl,
        provider,
        model,
        userContext: userContext || undefined,
      });

      if (!result) throw new Error('No response from background worker');
      if (!result.success) throw new Error(result.error);

      return rawSegments.map((s) => ({
        ...s,
        translatedText:
          result.segments.find((r: { id: string }) => r.id === s.id)?.translatedText ?? s.text,
      }));
    },
    [blockType, targetLanguage, provider, model, userContext, getContextBlocks]
  );

  const applyFromEntry = useCallback((entry: TranslationEntry, el: HTMLElement) => {
    if (!segmentsRef.current) return;
    const map = new Map(entry.segments.map((s) => [s.text, s.translatedText]));
    const updated = segmentsRef.current.map((s) => ({
      ...s,
      translatedText: map.get(s.text) ?? s.text,
    }));
    segmentsRef.current = updated;
    applyTranslation(updated, el);
  }, []);

  const translate = useCallback(async () => {
    if (stateRef.current === TranslateStateEnum.Loading) return;

    // If segments already extracted, just re-apply from memory
    if (segmentsRef.current) {
      applyTranslation(segmentsRef.current, getElement());
      setState(TranslateStateEnum.Translated);
      return;
    }

    setState(TranslateStateEnum.Loading);

    try {
      const el = getElement();
      const rawSegments = extractSegments(el);

      if (!rawSegments.length) {
        setState(TranslateStateEnum.Idle);
        return;
      }

      // Seed segmentsRef with original texts (translatedText = text initially)
      segmentsRef.current = rawSegments.map((s) => ({ ...s, translatedText: s.text }));

      // Check for a selected history entry
      const selectedEntry = await getSelectedEntry(blockId);

      if (selectedEntry) {
        applyFromEntry(selectedEntry, el);
        setState(TranslateStateEnum.Translated);
        return;
      }

      // No history — call API
      const translated = await callApi(segmentsRef.current);
      segmentsRef.current = translated;

      const updatedHistory = await addTranslationEntry(blockId, translated);
      setHistory(updatedHistory.entries);
      setHasTranslation(true);

      applyTranslation(translated, el);
      setState(TranslateStateEnum.Translated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Translation failed';
      toast.error(msg);
      setState(TranslateStateEnum.Idle);
    }
  }, [blockId, getElement, setState, callApi, applyFromEntry]);

  // Keep translateRef always pointing to the latest translate function
  useEffect(() => {
    translateRef.current = translate;
  });

  const retranslate = useCallback(async () => {
    if (stateRef.current === TranslateStateEnum.Loading) return;

    // Ensure segments are extracted
    let rawSegments = segmentsRef.current;
    if (!rawSegments) {
      const el = getElement();
      const extracted = extractSegments(el);
      if (!extracted.length) return;
      rawSegments = extracted.map((s) => ({ ...s, translatedText: s.text }));
      segmentsRef.current = rawSegments;
    }

    setState(TranslateStateEnum.Loading);

    try {
      // Use original texts from segmentsRef (.text is always original)
      const toTranslate = segmentsRef.current!.map(({ id, text }) => ({
        id,
        text,
        translatedText: text,
      }));
      const translated = await callApi(toTranslate);
      segmentsRef.current = translated;

      const updatedHistory = await addTranslationEntry(blockId, translated);
      setHistory(updatedHistory.entries);
      setHasTranslation(true);

      applyTranslation(translated, getElement());
      setState(TranslateStateEnum.Translated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Translation failed';
      toast.error(msg);
      setState(TranslateStateEnum.Idle);
    }
  }, [blockId, getElement, setState, callApi]);

  const selectHistoryEntry = useCallback(
    (entryId: string) => {
      // Storage change triggers the onChanged listener which re-applies
      selectEntry(blockId, entryId);
    },
    [blockId]
  );

  const deleteHistoryEntry = useCallback(
    (entryId: string) => {
      // Storage change triggers the onChanged listener which updates history state
      deleteEntry(blockId, entryId);
    },
    [blockId]
  );

  // Initialize history and hasTranslation from storage on mount
  useEffect(() => {
    getBlockHistory(blockId).then((hist) => {
      if (hist?.entries.length) {
        setHistory(hist.entries);
        setHasTranslation(true);
      }
    });
  }, [blockId]);

  // React to storage changes (sidebar operations, other tabs)
  useEffect(() => {
    return subscribeHistoryChangesApi((changedBlockId, changedPageId, hist) => {
      if (changedBlockId !== blockId || changedPageId !== location.pathname) return;

      if (!hist?.entries?.length) {
        setHistory([]);
        setHasTranslation(false);
        if (stateRef.current === TranslateStateEnum.Translated) restoreRef.current();
        return;
      }

      setHistory(hist.entries);
      setHasTranslation(true);

      // Re-apply if currently showing translation
      const selected = hist.entries.find((e) => e.selected);
      if (selected && stateRef.current === TranslateStateEnum.Translated && segmentsRef.current) {
        applyFromEntry(selected, getElement());
      }
    });
  }, [blockId, getElement, applyFromEntry]);

  // Auto-apply saved translation when store is ready and alwaysShowTranslated is enabled
  useEffect(() => {
    if (!ready || stateRef.current !== TranslateStateEnum.Idle || !alwaysShowTranslated) return;
    getBlockHistory(blockId).then((hist) => {
      if (hist?.entries.length) translateRef.current();
    });
  }, [blockId, ready, alwaysShowTranslated]);

  // React to alwaysShowTranslated changes from popup
  useEffect(() => {
    return useGlobalStore.subscribe((state, prev) => {
      if (state.alwaysShowTranslated === prev.alwaysShowTranslated) return;
      if (state.alwaysShowTranslated && stateRef.current === TranslateStateEnum.Idle) {
        getBlockHistory(blockId).then((hist) => {
          if (hist?.entries.length) translateRef.current();
        });
      } else if (
        !state.alwaysShowTranslated &&
        stateRef.current === TranslateStateEnum.Translated
      ) {
        restoreRef.current();
      }
    });
  }, [blockId]);

  return {
    state: uiState,
    translate,
    retranslate,
    restore,
    hasTranslation,
    history,
    selectHistoryEntry,
    deleteHistoryEntry,
  };
};
