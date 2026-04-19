// useTranslate.ts — Translation state machine with DOM segment extraction and local cache

import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { MessageType, type ExtensionSettings } from '../../types';
import { applyTranslation, extractSegments, restoreOriginal } from '../domSegments';
import type { TranslatedSegment } from '../domSegments';
import { getCached, setCached } from '../translationCache';

type TranslateState = 'idle' | 'loading' | 'translated';

export const useTranslate = (
  blockId: string,
  getSettings: () => Promise<ExtensionSettings>,
  getElement: () => HTMLElement
) => {
  const [uiState, setUiState] = useState<TranslateState>('idle');
  const stateRef = useRef<TranslateState>('idle');
  const segmentsRef = useRef<TranslatedSegment[] | null>(null);

  const setState = useCallback((s: TranslateState) => {
    stateRef.current = s;
    setUiState(s);
  }, []);

  const trigger = useCallback(async () => {
    const state = stateRef.current;
    const segments = segmentsRef.current;

    if (state === 'loading') return;

    if (state === 'translated' && segments) {
      restoreOriginal(segments, getElement());
      setState('idle');
      return;
    }

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

      // Check cache first — match by original text content
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
        const result = await chrome.runtime.sendMessage({
          type: MessageType.Translate,
          segments: rawSegments,
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
  }, [blockId, getSettings, getElement, setState]);

  return { state: uiState, trigger };
};
