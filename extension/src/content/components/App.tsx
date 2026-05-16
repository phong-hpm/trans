// App.tsx — Root content-script React app: platform scanning, history, settings, and dev logs

import type React from 'react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Toaster } from 'sonner';

import { getSettingsApi, subscribeSettingsChangesApi } from '../../apis/syncApi';
import ENV from '../../constants/env';
import { DEFAULT_SETTINGS } from '../../constants/settings';
import { LogTypeEnum, MessageTypeEnum } from '../../enums';
import { useGlobalStore } from '../../store/global';
import { useHistoryStore } from '../../store/history';
import type { ExtensionSettings } from '../../types';
import {
  PlatformRuntimeProvider,
  usePlatformRuntimeContext,
} from '../context/PlatformRuntimeContext';
import { GlobalActionButton } from './GlobalActionButton';
import { Sidebar } from './Sidebar';

const AppBase: React.FC = () => {
  const { href, platformAdapter, shadowAppRootElement } = usePlatformRuntimeContext();
  const platformName = platformAdapter?.name ?? null;
  const { init: initHistory } = useHistoryStore();
  const lastAutoTranslateHrefRef = useRef<string | null>(null);

  const runAutoTranslateAll = (targetHref: string): void => {
    if (lastAutoTranslateHrefRef.current === targetHref) return;
    lastAutoTranslateHrefRef.current = targetHref;
    setTimeout(() => document.dispatchEvent(new CustomEvent('trans:translate-all')), 1000);
  };

  useEffect(() => {
    let unsubscribeSettingsChanges: (() => void) | null = null;
    let cancelled = false;

    getSettingsApi(DEFAULT_SETTINGS).then((items) => {
      if (cancelled) return;

      useGlobalStore.setState({ settings: items as ExtensionSettings, ready: true });

      unsubscribeSettingsChanges = subscribeSettingsChangesApi((changes) => {
        const patch = Object.fromEntries(
          Object.entries(changes)
            .filter(([key]) => key in DEFAULT_SETTINGS)
            .map(([key, change]) => [key, change.newValue])
        ) as Partial<ExtensionSettings>;

        if (Object.keys(patch).length) {
          useGlobalStore.setState((state) => ({
            settings: { ...state.settings, ...patch },
          }));
        }
      });
    });

    return () => {
      cancelled = true;
      unsubscribeSettingsChanges?.();
    };
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
        state.settings.alwaysShowTranslated !== prev.settings.alwaysShowTranslated ||
        state.settings.autoTranslateTask !== prev.settings.autoTranslateTask;
      if (!changed) return;

      document.dispatchEvent(
        new CustomEvent('trans:settings-change', {
          detail: {
            alwaysShowTranslated: state.settings.alwaysShowTranslated,
            prevAlwaysShowTranslated: prev.settings.alwaysShowTranslated,
            autoTranslateTask: state.settings.autoTranslateTask,
            prevAutoTranslateTask: prev.settings.autoTranslateTask,
          },
        })
      );
    });
  }, []);

  useEffect(() => {
    return useGlobalStore.subscribe((state, prev) => {
      if (!state.ready || prev.ready || !state.settings.autoTranslateAll) return;
      runAutoTranslateAll(href);
    });
  }, [href]);

  useEffect(() => {
    if (!platformName) return;

    void initHistory(href).then(() => {
      if (useGlobalStore.getState().settings.autoTranslateAll) runAutoTranslateAll(href);
    });
  }, [href, platformName, initHistory]);

  return (
    <>
      {shadowAppRootElement &&
        createPortal(
          <>
            <Sidebar />
            <GlobalActionButton />
          </>,
          shadowAppRootElement
        )}

      {platformName && <Toaster position="bottom-right" richColors />}
    </>
  );
};

export const App: React.FC = () => (
  <PlatformRuntimeProvider>
    <AppBase />
  </PlatformRuntimeProvider>
);
