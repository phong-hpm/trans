// content-script.tsx — Entry point: initialises injection and watches for DOM changes

import ENV from '../constants/env';
import { githubIssueQueries as q } from '../constants/github-query';
import { LogType, MessageType } from '../types';
import { processBlocks } from './inject';
import { mountToaster } from './toast';

const initDevLogs = (): void => {
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type !== MessageType.DevLog) return;
    const { logType, label, entries } = message as {
      logType: LogType;
      label: string;
      entries: unknown[];
    };

    if (logType === LogType.Error) {
      console.group(`[BG][ERROR] ${label}`);
      console.warn(...entries);
      console.groupEnd();
    } else {
      console.groupCollapsed(`[BG][${logType.toUpperCase()}] ${label}`);
      console.log(...entries);
      console.groupEnd();
    }
  });
};

const init = (): void => {
  if (ENV.isDev) initDevLogs();

  mountToaster();

  // Retry on init — GitHub renders issue content asynchronously, so the first call may find nothing
  let attempts = 0;
  const retry = setInterval(() => {
    processBlocks();
    if (++attempts >= 10) clearInterval(retry);
  }, 500);

  let debounce: ReturnType<typeof setTimeout>;
  new MutationObserver(() => {
    clearTimeout(debounce);
    debounce = setTimeout(processBlocks, 400);
  }).observe(document.body, { childList: true, subtree: true });
};

if (location.pathname.match(q.pagePattern)) {
  init();
}
