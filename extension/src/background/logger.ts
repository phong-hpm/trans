// logger.ts — Grouped DevTools logger for background service worker requests

export const logCall = (method: string, url: string, data: unknown): void => {
  console.groupCollapsed(`[CALL] ${method} ${url}`);
  console.log('Request', data);
  console.groupEnd();
};

export const logResponse = (method: string, url: string, data: unknown, response: unknown): void => {
  console.groupCollapsed(`[RESPONSE] ${method} ${url}`);
  console.log('Request', data);
  console.log('Response', response);
  console.groupEnd();
};

export const logError = (method: string, url: string, data: unknown, error: unknown): void => {
  console.group(`[ERROR] ${method} ${url}`);
  console.warn('Request', data);
  console.warn('Error', error);
  console.groupEnd();
};
