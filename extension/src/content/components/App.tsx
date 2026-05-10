// App.tsx — Root content-script React app: platform scanning, history, settings, and dev logs

import type React from 'react';
import { useEffect, useRef } from 'react';
import { Toaster } from 'sonner';

import ENV from '../../constants/env';
import { LogTypeEnum, MessageTypeEnum } from '../../enums';
import { useGlobalStore } from '../../store/global';
import { useHistoryStore } from '../../store/history';
import { mountGlobalUiDom } from '../dom/globalUiDom';
import { useWatchPlatformDom } from '../hooks/useWatchPlatformDom';

export const App: React.FC = () => {
  const { href, platformName, getBlocks } = useWatchPlatformDom();
  const { init: initHistory } = useHistoryStore();
  const lastAutoTranslateHrefRef = useRef<string | null>(null);

  const runAutoTranslateAll = (targetHref: string): void => {
    if (lastAutoTranslateHrefRef.current === targetHref) return;
    lastAutoTranslateHrefRef.current = targetHref;
    setTimeout(() => document.dispatchEvent(new CustomEvent('trans:translate-all')), 1000);
  };

  useEffect(() => {
    useGlobalStore.getState().init();
  }, []);

  useEffect(() => {
    const handler = (message: unknown) => {
      if (!ENV.isDev) return;
      if (
        !message ||
        typeof message !== 'object' ||
        (message as { type?: unknown }).type !== MessageTypeEnum.DevLog
      ) {
        return;
      }

      const { logType, label, entries } = message as {
        logType: LogTypeEnum;
        label: string;
        entries: unknown[];
      };

      if (logType === LogTypeEnum.Error) {
        console.group(`[BG][ERROR] ${label}`);
        console.warn(...entries);
        console.groupEnd();
        return;
      }

      console.groupCollapsed(`[BG][${logType.toUpperCase()}] ${label}`);
      console.log(...entries);
      console.groupEnd();
    };

    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, []);

  useEffect(() => {
    return useGlobalStore.subscribe((state, prev) => {
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
  }, []);

  useEffect(() => {
    return useGlobalStore.subscribe((state, prev) => {
      if (!state.ready || prev.ready || !state.autoTranslateAll) return;
      runAutoTranslateAll(href);
    });
  }, [href]);

  useEffect(() => {
    useGlobalStore.getState().setPlatformName(platformName);
    if (!platformName) return;

    mountGlobalUiDom(getBlocks);

    void initHistory(href).then(() => {
      if (useGlobalStore.getState().autoTranslateAll) runAutoTranslateAll(href);
    });
  }, [href, platformName, getBlocks, initHistory]);

  return platformName ? <Toaster position="bottom-right" richColors /> : null;
};
