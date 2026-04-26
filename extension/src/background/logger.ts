// logger.ts — Grouped DevTools logger for background service worker requests

import ENV from '../constants/env';
import { LogTypeEnum, MessageTypeEnum } from '../enums';

interface LogPayload {
  type: MessageTypeEnum.DevLog;
  logType: LogTypeEnum;
  label: string;
  entries: unknown[];
}

const relayToPage = (payload: LogPayload): void => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0]?.id;
    if (tabId) chrome.tabs.sendMessage(tabId, payload).catch(() => {});
  });
};

export const logCall = (method: string, url: string, data: unknown): void => {
  const label = `${method} ${url}`;
  console.groupCollapsed(`[CALL] ${label}`);
  console.log('Request', data);
  console.groupEnd();

  if (ENV.isDev) {
    relayToPage({
      type: MessageTypeEnum.DevLog,
      logType: LogTypeEnum.Call,
      label,
      entries: [data],
    });
  }
};

export const logResponse = (
  method: string,
  url: string,
  data: unknown,
  response: unknown
): void => {
  const label = `${method} ${url}`;
  console.groupCollapsed(`[RESPONSE] ${label}`);
  console.log('Request', data);
  console.log('Response', response);
  console.groupEnd();

  if (ENV.isDev) {
    relayToPage({
      type: MessageTypeEnum.DevLog,
      logType: LogTypeEnum.Response,
      label,
      entries: [data, response],
    });
  }
};

export const logError = (method: string, url: string, data: unknown, error: unknown): void => {
  const label = `${method} ${url}`;
  console.group(`[ERROR] ${label}`);
  console.warn('Request', data);
  console.warn('Error', error);
  console.groupEnd();

  if (ENV.isDev) {
    relayToPage({
      type: MessageTypeEnum.DevLog,
      logType: LogTypeEnum.Error,
      label,
      entries: [data, error],
    });
  }
};
