// useTranslate.ts — Translation state machine with DOM segment extraction and local cache

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { type BlockType, type ContextBlock, MessageType } from '../../types';
import ENV from '../../constants/env';
import { useGlobalStore } from '../../store/global';
import { applyTranslation, extractSegments, restoreOriginal } from '../domSegments';
import type { TranslatedSegment } from '../domSegments';
import { getCached, setCached } from '../translationCache';

type TranslateState = 'idle' | 'loading' | 'translated';

export const useTranslate = (
  blockId: string,
  blockType: BlockType,
  getElement: () => HTMLElement,
  getContextBlocks?: () => ContextBlock[]
) => {
  const { targetLanguage, provider, model, ready, alwaysShowTranslated } = useGlobalStore();
  const [uiState, setUiState] = useState<TranslateState>('idle');
  const [hasTranslation, setHasTranslation] = useState(false);
  const stateRef = useRef<TranslateState>('idle');
  const segmentsRef = useRef<TranslatedSegment[] | null>(null);

  const setState = useCallback((s: TranslateState) => {
    stateRef.current = s;
    setUiState(s);
    if (s === 'translated') setHasTranslation(true);
  }, []);

  const restore = useCallback(() => {
    const segments = segmentsRef.current;
    if (!segments) return;
    restoreOriginal(segments, getElement());
    setState('idle');
  }, [getElement, setState]);

  const translate = useCallback(async () => {
    if (stateRef.current === 'loading') return;

    const segments = segmentsRef.current;

    if (segments) {
      applyTranslation(segments, getElement());
      setState('translated');
      return;
    }

    setState('loading');

    try {
      const el = getElement();
      const rawSegments = extractSegments(el);

      if (!rawSegments.length) {
        setState('idle');
        return;
      }

      const cached = await getCached(blockId);
      let translated: TranslatedSegment[];

      if (cached) {
        const map = new Map(cached.segments.map((s) => [s.text, s.translatedText]));
        translated = rawSegments.map((s) => ({
          ...s,
          translatedText: map.get(s.text) ?? s.text,
        }));
      } else {
        const contextBlocks = getContextBlocks?.() ?? [];

        const result = await chrome.runtime.sendMessage({
          type: MessageType.Translate,
          blockType,
          segments: rawSegments,
          contextBlocks,
          targetLanguage,
          backendUrl: ENV.backendUrl,
          provider,
          model,
        });

        if (!result) throw new Error('No response from background worker');
        if (!result.success) throw new Error(result.error);

        translated = rawSegments.map((s) => ({
          ...s,
          translatedText:
            result.segments.find((r: { id: string }) => r.id === s.id)?.translatedText ?? s.text,
        }));

        await setCached(blockId, translated);
      }

      segmentsRef.current = translated;
      applyTranslation(translated, el);
      setState('translated');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Translation failed';
      toast.error(msg);
      setState('idle');
    }
  }, [blockId, blockType, targetLanguage, provider, model, getElement, getContextBlocks, setState]);

  // Initialize hasTranslation from cache on mount — toggle shows without re-translating
  useEffect(() => {
    getCached(blockId).then((cached) => {
      if (cached) setHasTranslation(true);
    });
  }, [blockId]);

  // Keep stable refs so subscriptions always call the latest version
  const translateRef = useRef(translate);
  translateRef.current = translate;
  const restoreRef = useRef(restore);
  restoreRef.current = restore;

  // Auto-apply cached translation when store is ready and alwaysShowTranslated is enabled
  useEffect(() => {
    if (!ready || stateRef.current !== 'idle' || !alwaysShowTranslated) return;
    getCached(blockId).then((cached) => {
      if (cached) translateRef.current();
    });
  }, [blockId, ready, alwaysShowTranslated]);

  // React to alwaysShowTranslated changes from popup
  useEffect(() => {
    return useGlobalStore.subscribe((state, prev) => {
      if (state.alwaysShowTranslated === prev.alwaysShowTranslated) return;
      if (state.alwaysShowTranslated && stateRef.current === 'idle') {
        getCached(blockId).then((cached) => {
          if (cached) translateRef.current();
        });
      } else if (!state.alwaysShowTranslated && stateRef.current === 'translated') {
        restoreRef.current();
      }
    });
  }, [blockId]);

  return { state: uiState, translate, restore, hasTranslation };
};
