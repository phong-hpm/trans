// useTranslate.ts — Translation state machine with DOM segment extraction and local cache

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  type BlockType,
  type ContextBlock,
  type ExtensionSettings,
  MessageType,
} from '../../types';
import { applyTranslation, extractSegments, restoreOriginal } from '../domSegments';
import type { TranslatedSegment } from '../domSegments';
import { getCached, setCached } from '../translationCache';

type TranslateState = 'idle' | 'loading' | 'translated';

export const useTranslate = (
  blockId: string,
  blockType: BlockType,
  getSettings: () => Promise<ExtensionSettings>,
  getElement: () => HTMLElement,
  getContextBlocks?: () => ContextBlock[]
) => {
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
        const settings = await getSettings();
        const contextBlocks = getContextBlocks?.() ?? [];

        const result = await chrome.runtime.sendMessage({
          type: MessageType.Translate,
          blockType,
          segments: rawSegments,
          contextBlocks,
          targetLanguage: settings.targetLanguage,
          backendUrl: settings.backendUrl,
          provider: settings.provider,
          model: settings.model,
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
  }, [blockId, blockType, getSettings, getElement, getContextBlocks, setState]);

  // Keep stable refs so effects don't need to re-subscribe on every render
  const translateRef = useRef(translate);
  translateRef.current = translate;
  const restoreRef = useRef(restore);
  restoreRef.current = restore;

  // Auto-apply cached translation on mount if alwaysShowTranslated is enabled
  useEffect(() => {
    const check = async () => {
      if (stateRef.current !== 'idle') return;
      const settings = await getSettings();
      if (!settings.alwaysShowTranslated) return;
      const cached = await getCached(blockId);
      if (cached) translateRef.current();
    };
    check();
  }, [blockId, getSettings]);

  // React live to alwaysShowTranslated toggle from popup
  useEffect(() => {
    const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (!('alwaysShowTranslated' in changes)) return;
      const enabled = changes.alwaysShowTranslated.newValue as boolean;
      if (enabled && stateRef.current === 'idle') {
        getCached(blockId).then((cached) => {
          if (cached) translateRef.current();
        });
      } else if (!enabled && stateRef.current === 'translated') {
        restoreRef.current();
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, [blockId]);

  return { state: uiState, translate, restore, hasTranslation };
};
