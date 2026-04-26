// main.tsx — Entry point: detects platform, initialises injection, watches DOM

import ENV from '../constants/env';
import { LogTypeEnum, MessageTypeEnum } from '../enums';
import { detectPlatform } from '../platforms';
import type { PlatformAdapter } from '../platforms/types';
import { useGlobalStore } from '../store/global';
import { processBlocks } from './inject';
import { mountSidebar } from './sidebar';
import { mountToaster } from './toast';

const initDevLogs = (): void => {
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type !== MessageTypeEnum.DevLog) return;
    const { logType, label, entries } = message as {
      logType: LogTypeEnum;
      label: string;
      entries: unknown[];
    };

    if (logType === LogTypeEnum.Error) {
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

const init = (platform: PlatformAdapter): void => {
  if (ENV.isDev) initDevLogs();

  mountToaster();
  mountSidebar();

  // Retry on init — some platforms render content asynchronously
  let attempts = 0;
  const retry = setInterval(() => {
    processBlocks(platform.getBlocks());
    if (++attempts >= 10) clearInterval(retry);
  }, 500);

  let debounce: ReturnType<typeof setTimeout>;
  new MutationObserver(() => {
    clearTimeout(debounce);
    debounce = setTimeout(() => processBlocks(platform.getBlocks()), 400);
  }).observe(document.body, { childList: true, subtree: true });
};

useGlobalStore.getState().init();

const platform = detectPlatform(location.href);
if (platform) init(platform);
