// logger.ts — Grouped DevTools logger for background service worker requests

interface LogPayload {
  type: 'DEV_LOG';
  logType: 'call' | 'response' | 'error';
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

  if (import.meta.env.DEV) {
    relayToPage({ type: 'DEV_LOG', logType: 'call', label, entries: [data] });
  }
};

export const logResponse = (method: string, url: string, data: unknown, response: unknown): void => {
  const label = `${method} ${url}`;
  console.groupCollapsed(`[RESPONSE] ${label}`);
  console.log('Request', data);
  console.log('Response', response);
  console.groupEnd();

  if (import.meta.env.DEV) {
    relayToPage({ type: 'DEV_LOG', logType: 'response', label, entries: [data, response] });
  }
};

export const logError = (method: string, url: string, data: unknown, error: unknown): void => {
  const label = `${method} ${url}`;
  console.group(`[ERROR] ${label}`);
  console.warn('Request', data);
  console.warn('Error', error);
  console.groupEnd();

  if (import.meta.env.DEV) {
    relayToPage({ type: 'DEV_LOG', logType: 'error', label, entries: [data, error] });
  }
};
