// useTranslate.ts — Translation state machine with toast error reporting

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import type { ExtensionSettings } from '../../types';

type TranslateState = 'idle' | 'loading' | 'translated';

export const useTranslate = (
  getSettings: () => Promise<ExtensionSettings>,
  getText: () => string,
  onTranslate: (text: string) => void,
  onRestore: () => void
) => {
  const [state, setState] = useState<TranslateState>('idle');
  const [cached, setCached] = useState<string | null>(null);

  const trigger = useCallback(async () => {
    if (state === 'loading') return;

    if (state === 'translated') {
      onRestore();
      setState('idle');
      return;
    }

    if (cached !== null) {
      onTranslate(cached);
      setState('translated');
      return;
    }

    const text = getText().trim();
    if (!text) return;

    setState('loading');

    try {
      const settings = await getSettings();
      const result = await chrome.runtime.sendMessage({
        type: 'TRANSLATE',
        text,
        targetLanguage: settings.targetLanguage,
        backendUrl: settings.backendUrl,
      });

      if (!result) throw new Error('No response from background worker');
      if (!result.success) throw new Error(result.error);

      setCached(result.translatedText);
      onTranslate(result.translatedText);
      setState('translated');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Translation failed';
      toast.error(msg);
      setState('idle');
    }
  }, [state, cached, getSettings, getText, onTranslate, onRestore]);

  return { state, trigger };
};
