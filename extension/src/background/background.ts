// background.ts — Service worker proxy: relays translate requests to bypass content script CORS

import ENV from '../constants/env';
import { MessageTypeEnum } from '../enums';
import type {
  BackgroundBatchTranslateMessage,
  BatchTranslateResponse,
  TranslateRequest,
  TranslateResponse,
} from '../types';
import { logCall, logError, logResponse } from './logger';

interface TranslateMessage extends TranslateRequest {
  type: MessageTypeEnum.Translate;
}

// Forward icon click to the active content script as a ToggleModal message.
// Retries up to 3 times with a 350ms delay if the content script is not yet ready.
chrome.action.onClicked.addListener((tab) => {
  if (!tab.id) return;
  const tabId = tab.id;

  const sendToggle = async (maxRetries: number): Promise<void> => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await chrome.tabs.sendMessage(tabId, { type: MessageTypeEnum.ToggleModal });
        return;
      } catch {
        if (attempt < maxRetries) await new Promise((r) => setTimeout(r, 350));
      }
    }
  };

  void sendToggle(3);
});

const postJson = (url: string, body: unknown): Promise<Response> =>
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

chrome.runtime.onMessage.addListener(
  (
    message: TranslateMessage | BackgroundBatchTranslateMessage,
    _sender,
    sendResponse: (result: unknown) => void
  ) => {
    // ── Single-block translate ──────────────────────────────────────────────
    if (message.type === MessageTypeEnum.Translate) {
      const msg = message as TranslateMessage;
      const url = `${ENV.backendUrl}/translate`;
      const requestData: TranslateRequest = {
        blockType: msg.blockType,
        segments: msg.segments,
        contextBlocks: msg.contextBlocks,
        targetLanguage: msg.targetLanguage,
        provider: msg.provider,
        model: msg.model,
        userContext: msg.userContext,
      };

      logCall('POST', url, requestData);

      postJson(url, requestData)
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

    // ── Batch translate ─────────────────────────────────────────────────────
    if (message.type === MessageTypeEnum.BatchTranslate) {
      const msg = message as BackgroundBatchTranslateMessage;
      const url = `${ENV.backendUrl}/translate/batch`;
      const requestData = {
        blocks: msg.blocks,
        targetLanguage: msg.targetLanguage,
        provider: msg.provider,
        model: msg.model,
        userContext: msg.userContext,
      };

      logCall('POST', url, requestData);

      postJson(url, requestData)
        .then(async (res) => {
          if (!res.ok) {
            const err = (await res.json().catch(() => ({}))) as { error?: string };
            throw new Error(err.error ?? `HTTP ${res.status}`);
          }
          return res.json() as Promise<BatchTranslateResponse>;
        })
        .then((data) => {
          logResponse('POST', url, requestData, data);
          sendResponse({ success: true, blocks: data.blocks });
        })
        .catch((err: unknown) => {
          const error = err instanceof Error ? err.message : 'Batch translation failed';
          logError('POST', url, requestData, error);
          sendResponse({ success: false, error });
        });

      return true;
    }
  }
);
