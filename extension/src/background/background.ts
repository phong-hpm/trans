// background.ts — Service worker proxy: relays translate requests to bypass content script CORS

import { MessageType, type TranslateRequest, type TranslateResponse } from '../types';
import { logCall, logError, logResponse } from './logger';

interface TranslateMessage extends TranslateRequest {
  type: MessageType.Translate;
  backendUrl: string;
}

interface TranslateResult {
  success: true;
  segments: TranslateResponse['segments'];
}

interface TranslateError {
  success: false;
  error: string;
}

type MessageResult = TranslateResult | TranslateError;

chrome.runtime.onMessage.addListener(
  (message: TranslateMessage, _sender, sendResponse: (result: MessageResult) => void) => {
    if (message.type !== MessageType.Translate) return;

    const url = `${message.backendUrl}/translate`;  // backendUrl already includes /api/v1
    const requestData: TranslateRequest = {
      blockType: message.blockType,
      segments: message.segments,
      contextBlocks: message.contextBlocks,
      targetLanguage: message.targetLanguage,
      provider: message.provider,
      model: message.model,
    };

    logCall('POST', url, requestData);

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(err.error ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<TranslateResponse>;
      })
      .then((data) => {
        logResponse('POST', url, requestData, data);
        sendResponse({ success: true, segments: data.segments });
      })
      .catch((err: unknown) => {
        const error = err instanceof Error ? err.message : 'Translation failed';
        logError('POST', url, requestData, error);
        sendResponse({ success: false, error });
      });

    return true;
  }
);
