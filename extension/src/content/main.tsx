// main.tsx — Entry point: detects platform, initialises injection, watches DOM

import ENV from '../constants/env';
import { LogTypeEnum, MessageTypeEnum } from '../enums';
import { detectPlatform } from '../platforms';
import type { PlatformAdapter } from '../platforms/types';
import { useGlobalStore } from '../store/global';
import { useHistoryStore } from '../store/history';
import { processBlocksDom } from './dom/injectDom';
import {
  mountModalDom,
  mountSidebarDom,
  mountToasterDom,
  mountTranslateAllDom,
} from './dom/mountDom';
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

const initAutoTranslateAll = (): void => {
  // Fire once when the store becomes ready; delay 1s to let block toolbars be injected first
  const unsub = useGlobalStore.subscribe((state, prev) => {
    if (!state.ready || prev.ready) return;
    unsub();
    if (state.autoTranslateAll) {
      setTimeout(() => document.dispatchEvent(new CustomEvent('trans:translate-all')), 1000);
    }
  });
};

/**
 * Single global settings watcher — dispatches a DOM event when per-block settings change.
 * This replaces N per-block useGlobalStore.subscribe calls (one per mounted block) with a
 * single subscription, reducing overhead proportional to the number of blocks on the page.
 */
const initSettingsWatcher = (): void => {
  useGlobalStore.subscribe((state, prev) => {
    const changed =
      state.alwaysShowTranslated !== prev.alwaysShowTranslated ||
      state.autoTranslateTask !== prev.autoTranslateTask;
    if (!changed) return;

    document.dispatchEvent(
      new CustomEvent('trans:settings-change', {
        detail: {
          alwaysShowTranslated: state.alwaysShowTranslated,
          prevAlwaysShowTranslated: prev.alwaysShowTranslated,
          autoTranslateTask: state.autoTranslateTask,
          prevAutoTranslateTask: prev.autoTranslateTask,
        },
      })
    );
  });
};

const init = (platform: PlatformAdapter): void => {
  if (ENV.isDev) initDevLogs();

  mountToasterDom();
  mountSidebarDom();
  initAutoTranslateAll();
  initSettingsWatcher();

  // Retry on init — some platforms render content asynchronously
  let attempts = 0;
  const retry = setInterval(() => {
    const blocks = platform.getBlocks();
    processBlocksDom(blocks);

    if (platform.getHeaderAnchor) {
      const anchor = platform.getHeaderAnchor();
      if (anchor) mountTranslateAllDom(anchor, () => platform.getBlocks().length);
    }

    if (++attempts >= 10) clearInterval(retry);
  }, 500);

  // Track URL for Turbo soft navigation detection
  let lastUrl = location.href;

  observePageDom(() => {
    // GitHub Turbo navigation: re-init history store when URL changes
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      useHistoryStore.getState().init(location.href);
    }

    const blocks = platform.getBlocks();
    processBlocksDom(blocks);

    if (platform.getHeaderAnchor) {
      const anchor = platform.getHeaderAnchor();
      if (anchor) mountTranslateAllDom(anchor, () => platform.getBlocks().length);
    }
  });
};

useGlobalStore.getState().init();
useHistoryStore.getState().init(location.href);

// Modal and its toggle listener are platform-independent — always mount
initModalToggle();
mountModalDom();

const platform = detectPlatform(location.href);
useGlobalStore.getState().setPlatformName(platform?.name ?? null);
if (platform) init(platform);
