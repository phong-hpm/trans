// content-script.tsx — Entry point: initialises injection and watches for DOM changes

import { githubIssueQueries as q } from '../constants/github-query';
import { LogType } from '../types';
import { processBlocks } from './inject';
import { mountToaster } from './toast';

const initDevLogs = (): void => {
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type !== 'DEV_LOG') return;
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
  if (import.meta.env.DEV) initDevLogs();

  mountToaster();
  processBlocks();

  let debounce: ReturnType<typeof setTimeout>;
  new MutationObserver(() => {
    clearTimeout(debounce);
    debounce = setTimeout(processBlocks, 400);
  }).observe(document.body, { childList: true, subtree: true });
};

if (location.pathname.match(q.pagePattern)) {
  init();
}
