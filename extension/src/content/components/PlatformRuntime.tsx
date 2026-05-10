// PlatformRuntime.tsx — React-owned side effects for platform state, history, settings, and dev logs

import type React from 'react';
import { useEffect, useRef } from 'react';
import { Toaster } from 'sonner';

import ENV from '../../constants/env';
import { LogTypeEnum, MessageTypeEnum } from '../../enums';
import type { Block } from '../../platforms/types';
import { useGlobalStore } from '../../store/global';
import { useHistoryStore } from '../../store/history';
import { mountSidebarDom, mountTranslateAllDom } from '../dom/mountDom';

interface Props {
  href: string;
  platformName: string | null;
  getBlocks: () => Block[];
}

export const PlatformRuntime: React.FC<Props> = ({ href, platformName, getBlocks }) => {
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

    mountSidebarDom();
    mountTranslateAllDom(getBlocks);

    void useHistoryStore
      .getState()
      .init(href)
      .then(() => {
        if (useGlobalStore.getState().autoTranslateAll) runAutoTranslateAll(href);
      });
  }, [href, platformName, getBlocks]);

  return platformName ? <Toaster position="bottom-right" richColors /> : null;
};
