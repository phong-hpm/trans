// main.tsx — Entry point: detects platform, initialises injection, watches DOM

import ENV from '../constants/env';
import { LogTypeEnum, MessageTypeEnum } from '../enums';
import { detectPlatform } from '../platforms';
import type { PlatformAdapter } from '../platforms/types';
import { useGlobalStore } from '../store/global';
import { useHistoryStore } from '../store/history';
import { processBlocksDom } from './dom/injectDom';
import { mountModalDom, mountSidebarDom, mountToasterDom } from './dom/mountDom';
import { observePageDom } from './dom/observerDom';

const initModalToggle = (): void => {
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === MessageTypeEnum.ToggleModal) {
      useGlobalStore.getState().toggleModal();
    }
  });
};

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

  mountToasterDom();
  mountSidebarDom();

  // Retry on init — some platforms render content asynchronously
  let attempts = 0;
  const retry = setInterval(() => {
    processBlocksDom(platform.getBlocks());
    if (++attempts >= 10) clearInterval(retry);
  }, 500);

  observePageDom(() => processBlocksDom(platform.getBlocks()));
};

useGlobalStore.getState().init();
useHistoryStore.getState().init(location.pathname);

// Modal and its toggle listener are platform-independent — always mount
initModalToggle();
mountModalDom();

const platform = detectPlatform(location.href);
useGlobalStore.getState().setPlatformName(platform?.name ?? null);
if (platform) init(platform);
