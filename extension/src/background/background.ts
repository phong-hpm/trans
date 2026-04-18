// background.ts — Service worker proxy: relays translate requests to bypass content script CORS

import type { TranslateRequest, TranslateResponse } from '../types';

interface TranslateMessage extends TranslateRequest {
  type: 'TRANSLATE';
  backendUrl: string;
}

interface TranslateResult {
  success: true;
  translatedText: string;
}

interface TranslateError {
  success: false;
  error: string;
}

type MessageResult = TranslateResult | TranslateError;

chrome.runtime.onMessage.addListener(
  (message: TranslateMessage, _sender, sendResponse: (result: MessageResult) => void) => {
    if (message.type !== 'TRANSLATE') return;

    fetch(`${message.backendUrl}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: message.text,
        targetLanguage: message.targetLanguage,
      } satisfies TranslateRequest),
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(err.error ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<TranslateResponse>;
      })
      .then((data) => sendResponse({ success: true, translatedText: data.translatedText }))
      .catch((err: unknown) => {
        const error = err instanceof Error ? err.message : 'Translation failed';
        sendResponse({ success: false, error });
      });

    // Return true to keep the message channel open for the async response
    return true;
  }
);
