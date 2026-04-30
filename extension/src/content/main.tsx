// main.tsx — Entry point: detects platform, initialises injection, watches DOM

import ENV from '../constants/env';
import { LogTypeEnum, MessageTypeEnum } from '../enums';
import { detectPlatform } from '../platforms';
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

/**
 * Mounts platform-level UI (toaster + sidebar). Both are idempotent — safe to call on
 * every observer tick; they bail out immediately if already mounted.
 */
const mountPlatformDom = (): void => {
  mountToasterDom();
  mountSidebarDom();
};

// ─── Module-level setup (platform-independent) ────────────────────────────────

useGlobalStore.getState().init();
initModalToggle();
mountModalDom();

if (ENV.isDev) initDevLogs();
initAutoTranslateAll();
initSettingsWatcher();

// ─── Page observer — always active, even when starting on a non-platform page ─
//
// Starting on e.g. GitHub issue *list* means detectPlatform returns null at load
// time, so observePageDom must be set up unconditionally at module level.
// Platform detection runs inside the callback so Turbo soft-navigations that
// move from a non-platform page to a platform page are handled correctly.

let lastUrl = location.href;

observePageDom(async () => {
  const platform = detectPlatform(location.href);

  if (location.href !== lastUrl) {
    lastUrl = location.href;
    useGlobalStore.getState().setPlatformName(platform?.name ?? null);

    if (platform) {
      // Await so processBlocksDom below sees the fresh histories for the new page
      await useHistoryStore.getState().init(location.href);
      // initAutoTranslateAll only fires on the first ready transition; handle
      // subsequent Turbo navigations by checking the setting directly
      if (useGlobalStore.getState().autoTranslateAll) {
        setTimeout(() => document.dispatchEvent(new CustomEvent('trans:translate-all')), 1000);
      }
    }
  }

  if (!platform) return;

  mountPlatformDom();
  mountTranslateAllDom(() => platform.getBlocks());

  const blocks = platform.getBlocks();
  processBlocksDom(blocks);
});

// ─── Initial load: retry interval for async platform content ──────────────────
//
// Some platforms (GitHub) render content asynchronously after the content
// script fires. Retry processBlocksDom a few times to catch late-arriving nodes.
// The observer above handles all subsequent mutations.

const initialPlatform = detectPlatform(location.href);
useGlobalStore.getState().setPlatformName(initialPlatform?.name ?? null);

if (initialPlatform) {
  mountPlatformDom();

  // Await history init before starting block injection so the first
  // processBlocksDom run sees the loaded histories (avoids startup race).
  mountTranslateAllDom(() => initialPlatform.getBlocks());

  void useHistoryStore
    .getState()
    .init(location.href)
    .then(() => {
      let attempts = 0;
      const retry = setInterval(() => {
        processBlocksDom(initialPlatform.getBlocks());
        if (++attempts >= 10) clearInterval(retry);
      }, 500);
    });
}
