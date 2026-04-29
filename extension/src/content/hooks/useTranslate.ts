// useTranslate.ts — Per-block translation state machine
//
// State machine: Idle → Loading → Translated → Idle (via restore).
// Transitions are tracked in stateRef (always current) and mirrored to uiState (for renders).
//
// segmentsRef is the single owner of translated segment data — it is set once during the
// first translate() call (after DOM extraction) and updated in-place on re-apply / retranslate.
// stateRef + segmentsRef together form the block's runtime translation state; uiState is the
// React mirror used for rendering only.

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import ENV from '../../constants/env';
import { type BlockTypeEnum, MessageTypeEnum, TranslateStateEnum } from '../../enums';
import { useGlobalStore } from '../../store/global';
import { useHistoryStore } from '../../store/history';
import type { ContextBlock, TranslationEntry } from '../../types';
import { isActive, markActive, markInactive } from '../activeTranslations';
import { observeBlockDom } from '../dom/observerDom';
import type { TranslatedSegment } from '../dom/segmentsDom';
import { applyTranslationDom, extractSegmentsDom, restoreOriginalDom } from '../dom/segmentsDom';
import { addTranslationEntry, deleteEntry, selectEntry } from '../translationSync';

type TranslateState = TranslateStateEnum;

export const useTranslate = (
  parsedContent: string,
  blockType: BlockTypeEnum,
  getElement: () => HTMLElement,
  getContextBlocks?: () => ContextBlock[],
  getContainerEl?: () => HTMLElement
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
  // Stable refs — always point to the latest translate/restore without causing re-subscriptions.
  // Effects that call these use no dep array so the ref is updated every render.
  const translateRef = useRef<() => Promise<void>>(async () => {});
  const restoreRef = useRef<() => void>(() => {});

  const setState = useCallback(
    (s: TranslateState) => {
      stateRef.current = s;
      setUiState(s);
      if (s === TranslateStateEnum.Translated) {
        setHasTranslation(true);
        markActive(parsedContent);
      } else if (s === TranslateStateEnum.Idle) {
        markInactive(parsedContent);
      }
    },
    [parsedContent]
  );

  const restore = useCallback(() => {
    const segments = segmentsRef.current;
    if (!segments) return;
    restoreOriginalDom(segments, getElement());
    setState(TranslateStateEnum.Idle);
  }, [getElement, setState]);

  // No dep array — runs every render to keep ref pointing at the latest restore closure
  useEffect(() => {
    restoreRef.current = restore;
  });

  const callApi = useCallback(
    async (rawSegments: TranslatedSegment[]): Promise<TranslatedSegment[]> => {
      const contextBlocks = getContextBlocks?.() ?? [];
      const result = await chrome.runtime.sendMessage({
        type: MessageTypeEnum.Translate,
        // blockType is sent to the backend for future prompt differentiation (e.g. title vs comment tone)
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

  /**
   * Applies translated segments to the current live element.
   * Handles the case where the element was replaced after segments were extracted:
   * if our span IDs are gone, re-extracts fresh text nodes and maps translations by text.
   */
  const applyToLiveElement = useCallback(
    (translated: TranslatedSegment[]): void => {
      const currentEl = getElement();
      const firstId = translated[0]?.id;
      const spansPresent = firstId
        ? !!currentEl.querySelector(`[data-trans-id="${firstId}"]`)
        : false;

      if (spansPresent) {
        segmentsRef.current = translated;
        applyTranslationDom(translated, currentEl);
      } else {
        // Element replaced during async gap — re-extract text nodes and re-apply by text match
        const map = new Map(translated.map((s) => [s.text, s.translatedText]));
        const raw = extractSegmentsDom(currentEl);
        if (raw.length) {
          const rehydrated = raw.map((s) => ({
            ...s,
            translatedText: map.get(s.text) ?? s.text,
          }));
          segmentsRef.current = rehydrated;
          applyTranslationDom(rehydrated, currentEl);
        }
      }
    },
    [getElement]
  );

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
      const el = getElement();
      const rawSegments = extractSegmentsDom(el);

      if (!rawSegments.length) {
        setState(TranslateStateEnum.Idle);
        return;
      }

      segmentsRef.current = rawSegments.map((s) => ({ ...s, translatedText: s.text }));

      // Check for a selected history entry (synchronous — no async gap, el is still valid)
      const selectedEntry = useHistoryStore.getState().getSelectedEntry(parsedContent);
      if (selectedEntry) {
        applyFromEntry(selectedEntry, el);
        setState(TranslateStateEnum.Translated);
        return;
      }

      // No history — call API (async: element may be replaced while waiting)
      const translated = await callApi(segmentsRef.current);

      const updatedHistory = await addTranslationEntry(parsedContent, translated);
      setHistory(updatedHistory.entries);
      setHasTranslation(true);

      // Apply to current live element — handles replacement that happened during API call
      applyToLiveElement(translated);
      setState(TranslateStateEnum.Translated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Translation failed';
      toast.error(msg);
      setState(TranslateStateEnum.Idle);
    }
  }, [parsedContent, getElement, setState, callApi, applyFromEntry, applyToLiveElement]);

  // No dep array — runs every render to keep ref pointing at the latest translate closure
  useEffect(() => {
    translateRef.current = translate;
  });

  const retranslate = useCallback(async () => {
    if (stateRef.current === TranslateStateEnum.Loading) return;

    // If no segments yet, extract from current live element first
    if (!segmentsRef.current) {
      const el = getElement();
      const extracted = extractSegmentsDom(el);
      if (!extracted.length) return;
      segmentsRef.current = extracted.map((s) => ({ ...s, translatedText: s.text }));
    }

    setState(TranslateStateEnum.Loading);

    try {
      const toTranslate = segmentsRef.current.map(({ id, text }) => ({
        id,
        text,
        translatedText: text,
      }));
      const translated = await callApi(toTranslate);

      const updatedHistory = await addTranslationEntry(parsedContent, translated);
      setHistory(updatedHistory.entries);
      setHasTranslation(true);

      // Apply to current live element — handles replacement during API call
      applyToLiveElement(translated);
      setState(TranslateStateEnum.Translated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Translation failed';
      toast.error(msg);
      setState(TranslateStateEnum.Idle);
    }
  }, [parsedContent, getElement, setState, callApi, applyToLiveElement]);

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

  // Initialize history and hasTranslation from store on mount.
  // If the block was actively showing translation before a re-render (tracked in activeTranslations),
  // auto-restore the translation so the user doesn't see a flash of original content.
  useEffect(() => {
    const hist = useHistoryStore.getState().getBlockHistory(parsedContent);
    if (hist?.entries.length) {
      setHistory(hist.entries);
      setHasTranslation(true);
      if (isActive(parsedContent)) {
        translateRef.current();
      }
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

  // Watch the stable container element for descendant changes.
  // When the content element inside is replaced (e.g. GitHub token refresh), re-apply translation.
  // Uses containerEl (stable ancestor) instead of contentEl.parentElement so the observer
  // survives full comment-wrapper replacements.
  useEffect(() => {
    const containerEl = getContainerEl?.() ?? getElement().parentElement ?? document.body;

    return observeBlockDom(containerEl, (observer) => {
      if (stateRef.current !== TranslateStateEnum.Translated) return;
      if (!segmentsRef.current?.length) return;

      const liveEl = getElement();
      if (!liveEl.isConnected) return; // block removed from DOM

      // If our spans still exist in the current element, nothing to re-apply
      const firstId = segmentsRef.current[0].id;
      if (liveEl.querySelector(`[data-trans-id="${firstId}"]`)) return;

      // Content element was replaced — re-extract and re-apply translation
      const translationMap = new Map(segmentsRef.current.map((s) => [s.text, s.translatedText]));

      // Disconnect before mutating DOM to prevent infinite callback loop
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

      // Reconnect to the same stable container
      observer.observe(containerEl, { childList: true, subtree: true });
    });
  }, [getElement, getContainerEl]);

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

  // React to alwaysShowTranslated / autoTranslateTask changes at runtime.
  // Listens to a DOM event dispatched by a single global watcher in main.tsx,
  // avoiding N per-block Zustand subscriptions (one per mounted block).
  useEffect(() => {
    const handler = (e: Event) => {
      const {
        alwaysShowTranslated,
        prevAlwaysShowTranslated,
        autoTranslateTask,
        prevAutoTranslateTask,
      } = (
        e as CustomEvent<{
          alwaysShowTranslated: boolean;
          prevAlwaysShowTranslated: boolean;
          autoTranslateTask: boolean;
          prevAutoTranslateTask: boolean;
        }>
      ).detail;

      // alwaysShowTranslated toggled on → apply from history; toggled off → restore
      if (alwaysShowTranslated !== prevAlwaysShowTranslated) {
        if (alwaysShowTranslated && stateRef.current === TranslateStateEnum.Idle) {
          const hist = useHistoryStore.getState().getBlockHistory(parsedContent);
          if (hist?.entries.length) translateRef.current();
        } else if (
          !alwaysShowTranslated &&
          !autoTranslateTask &&
          stateRef.current === TranslateStateEnum.Translated
        ) {
          restoreRef.current();
        }
      }

      // autoTranslateTask toggled on → translate (API if needed); toggled off → restore
      if (autoTranslateTask !== prevAutoTranslateTask) {
        if (autoTranslateTask && stateRef.current === TranslateStateEnum.Idle) {
          translateRef.current();
        } else if (
          !autoTranslateTask &&
          !alwaysShowTranslated &&
          stateRef.current === TranslateStateEnum.Translated
        ) {
          restoreRef.current();
        }
      }
    };

    document.addEventListener('trans:settings-change', handler);
    return () => document.removeEventListener('trans:settings-change', handler);
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
