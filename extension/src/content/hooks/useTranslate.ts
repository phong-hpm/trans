// useTranslate.ts — Translation state machine with history tracking, DOM segment extraction

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import ENV from '../../constants/env';
import { type BlockTypeEnum, MessageTypeEnum, TranslateStateEnum } from '../../enums';
import { useGlobalStore } from '../../store/global';
import { useHistoryStore } from '../../store/history';
import type { ContextBlock, TranslationEntry } from '../../types';
import { observeBlockDom } from '../dom/observerDom';
import type { TranslatedSegment } from '../dom/segmentsDom';
import { applyTranslationDom, extractSegmentsDom, restoreOriginalDom } from '../dom/segmentsDom';
import { addTranslationEntry, deleteEntry, selectEntry } from '../translationSync';

type TranslateState = TranslateStateEnum;

export const useTranslate = (
  parsedContent: string,
  blockType: BlockTypeEnum,
  getElement: () => HTMLElement,
  getContextBlocks?: () => ContextBlock[]
) => {
  const {
    targetLanguage,
    provider,
    model,
    userContext,
    ready,
    alwaysShowTranslated,
    autoTranslateTask,
  } = useGlobalStore();
  const [uiState, setUiState] = useState<TranslateState>(TranslateStateEnum.Idle);
  const [hasTranslation, setHasTranslation] = useState(false);
  const [history, setHistory] = useState<TranslationEntry[]>([]);
  const stateRef = useRef<TranslateState>(TranslateStateEnum.Idle);
  const segmentsRef = useRef<TranslatedSegment[] | null>(null);
  // Keep stable refs so effects always call the latest version
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
    restoreOriginalDom(segments, getElement());
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
    applyTranslationDom(updated, el);
  }, []);

  const translate = useCallback(async () => {
    if (stateRef.current === TranslateStateEnum.Loading) return;

    // If segments already extracted, just re-apply from memory
    if (segmentsRef.current) {
      applyTranslationDom(segmentsRef.current, getElement());
      setState(TranslateStateEnum.Translated);
      return;
    }

    setState(TranslateStateEnum.Loading);

    try {
      const el = getElement();
      const rawSegments = extractSegmentsDom(el);

      if (!rawSegments.length) {
        setState(TranslateStateEnum.Idle);
        return;
      }

      segmentsRef.current = rawSegments.map((s) => ({ ...s, translatedText: s.text }));

      // Check for a selected history entry
      const selectedEntry = useHistoryStore.getState().getSelectedEntry(parsedContent);

      if (selectedEntry) {
        applyFromEntry(selectedEntry, el);
        setState(TranslateStateEnum.Translated);
        return;
      }

      // No history — call API
      const translated = await callApi(segmentsRef.current);
      segmentsRef.current = translated;

      const updatedHistory = await addTranslationEntry(parsedContent, translated);
      setHistory(updatedHistory.entries);
      setHasTranslation(true);

      applyTranslationDom(translated, el);
      setState(TranslateStateEnum.Translated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Translation failed';
      toast.error(msg);
      setState(TranslateStateEnum.Idle);
    }
  }, [parsedContent, getElement, setState, callApi, applyFromEntry]);

  useEffect(() => {
    translateRef.current = translate;
  });

  const retranslate = useCallback(async () => {
    if (stateRef.current === TranslateStateEnum.Loading) return;

    let rawSegments = segmentsRef.current;
    if (!rawSegments) {
      const el = getElement();
      const extracted = extractSegmentsDom(el);
      if (!extracted.length) return;
      rawSegments = extracted.map((s) => ({ ...s, translatedText: s.text }));
      segmentsRef.current = rawSegments;
    }

    setState(TranslateStateEnum.Loading);

    try {
      const toTranslate = segmentsRef.current!.map(({ id, text }) => ({
        id,
        text,
        translatedText: text,
      }));
      const translated = await callApi(toTranslate);
      segmentsRef.current = translated;

      const updatedHistory = await addTranslationEntry(parsedContent, translated);
      setHistory(updatedHistory.entries);
      setHasTranslation(true);

      applyTranslationDom(translated, getElement());
      setState(TranslateStateEnum.Translated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Translation failed';
      toast.error(msg);
      setState(TranslateStateEnum.Idle);
    }
  }, [parsedContent, getElement, setState, callApi]);

  const selectHistoryEntry = useCallback(
    (entryId: string) => {
      selectEntry(parsedContent, entryId);
    },
    [parsedContent]
  );

  const deleteHistoryEntry = useCallback(
    (entryId: string) => {
      deleteEntry(parsedContent, entryId);
    },
    [parsedContent]
  );

  // Initialize history and hasTranslation from store on mount
  useEffect(() => {
    const hist = useHistoryStore.getState().getBlockHistory(parsedContent);
    if (hist?.entries.length) {
      setHistory(hist.entries);
      setHasTranslation(true);
    }
  }, [parsedContent]);

  // React to store changes (sidebar operations, other tabs via storage subscription)
  useEffect(() => {
    return useHistoryStore.subscribe((state) => {
      const hist = state.histories.find((h) => h.parsedContent === parsedContent);

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
  }, [parsedContent, getElement, applyFromEntry]);

  // Auto-apply saved translation when store is ready and alwaysShowTranslated is enabled
  useEffect(() => {
    if (!ready || stateRef.current !== TranslateStateEnum.Idle || !alwaysShowTranslated) return;
    const hist = useHistoryStore.getState().getBlockHistory(parsedContent);
    if (hist?.entries.length) translateRef.current();
  }, [parsedContent, ready, alwaysShowTranslated]);

  // Auto-translate this block on load if autoTranslateTask is enabled:
  // applies from history if available, otherwise calls the API
  useEffect(() => {
    if (!ready || stateRef.current !== TranslateStateEnum.Idle || !autoTranslateTask) return;
    translateRef.current();
  }, [parsedContent, ready, autoTranslateTask]);

  // Watch for re-rendering the block and re-apply translation after framework re-renders
  useEffect(() => {
    return observeBlockDom(getElement, (observer) => {
      if (stateRef.current !== TranslateStateEnum.Translated) return;
      if (!segmentsRef.current?.length) return;

      const liveEl = getElement();
      if (!liveEl.isConnected) {
        // Element temporarily detached — reconnect observer to body so next mutation is caught
        observer.disconnect();
        observer.observe(document.body, { childList: true, subtree: true });
        return;
      }

      const firstId = segmentsRef.current[0].id;
      if (liveEl.querySelector(`[data-trans-id="${firstId}"]`)) return;

      const translationMap = new Map(segmentsRef.current.map((s) => [s.text, s.translatedText]));

      // Pause observation so our own DOM mutations don't retrigger the callback
      observer.disconnect();

      const raw = extractSegmentsDom(liveEl);
      if (raw.length) {
        const rehydrated = raw.map((s) => ({
          ...s,
          translatedText: translationMap.get(s.text) ?? s.text,
        }));
        segmentsRef.current = rehydrated;
        applyTranslationDom(rehydrated, liveEl);
      }

      // Resume on the (potentially new) parent
      const newParent = liveEl.parentElement ?? document.body;
      observer.observe(newParent, { childList: true, subtree: true });
    });
  }, [getElement]);

  // Handle translate-all event: run translate() and signal completion when done
  useEffect(() => {
    const handler = async () => {
      if (stateRef.current === TranslateStateEnum.Loading) {
        // Already translating — signal done so the progress counter doesn't stall
        document.dispatchEvent(new CustomEvent('trans:translate-done'));
        return;
      }
      try {
        await translateRef.current();
      } finally {
        document.dispatchEvent(new CustomEvent('trans:translate-done'));
      }
    };
    document.addEventListener('trans:translate-all', handler);
    return () => document.removeEventListener('trans:translate-all', handler);
  }, []);

  // React to alwaysShowTranslated / autoTranslateTask changes at runtime
  useEffect(() => {
    return useGlobalStore.subscribe((state, prev) => {
      // alwaysShowTranslated toggled on → apply from history; toggled off → restore
      if (state.alwaysShowTranslated !== prev.alwaysShowTranslated) {
        if (state.alwaysShowTranslated && stateRef.current === TranslateStateEnum.Idle) {
          const hist = useHistoryStore.getState().getBlockHistory(parsedContent);
          if (hist?.entries.length) translateRef.current();
        } else if (
          !state.alwaysShowTranslated &&
          !state.autoTranslateTask &&
          stateRef.current === TranslateStateEnum.Translated
        ) {
          restoreRef.current();
        }
      }

      // autoTranslateTask toggled on → translate (API if needed); toggled off → restore
      if (state.autoTranslateTask !== prev.autoTranslateTask) {
        if (state.autoTranslateTask && stateRef.current === TranslateStateEnum.Idle) {
          translateRef.current();
        } else if (
          !state.autoTranslateTask &&
          !state.alwaysShowTranslated &&
          stateRef.current === TranslateStateEnum.Translated
        ) {
          restoreRef.current();
        }
      }
    });
  }, [parsedContent]);

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
