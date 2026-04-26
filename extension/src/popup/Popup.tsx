// Popup.tsx — Extension popup: language settings, provider/model, always-show toggle, clear history

import clsx from 'clsx';
import type React from 'react';
import { useEffect, useState } from 'react';

import {
  clearAllHistoriesApi,
  clearPageHistoriesApi,
  getAllHistoriesApi,
} from '../apis/historyApi';
import { getStorageQuotaApi, getStorageUsageApi } from '../apis/storageApi';
import { ConfirmButton } from '../components/Button';
import { Select } from '../components/Select';
import { ThemeWrapper } from '../components/ThemeWrapper';
import { Toggle } from '../components/Toggle';
import { LANGUAGES } from '../constants/languages';
import { MODELS, PROVIDERS } from '../constants/providers';
import type { ProviderEnum } from '../enums';
import { ThemeEnum } from '../enums';
import { useGlobalStore } from '../store/global';

const toMB = (bytes: number) => (bytes / (1024 * 1024)).toFixed(2);

export const Popup: React.FC = () => {
  const {
    ready,
    theme,
    targetLanguage,
    provider,
    model,
    alwaysShowTranslated,
    showSidebar,
    updateSettings,
  } = useGlobalStore();

  const [pagePathname, setPagePathname] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [usedBytes, setUsedBytes] = useState(0);
  const [limitBytes, setLimitBytes] = useState(0);

  const refreshUsage = () => {
    getStorageUsageApi().then(setUsedBytes);
    getStorageQuotaApi().then(setLimitBytes);
  };

  const refreshPageCount = (pathname: string) => {
    getAllHistoriesApi(pathname).then((histories) => setPageCount(histories.length));
  };

  useEffect(() => {
    refreshUsage();
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs[0]?.url;
      if (!url) return;
      try {
        const pathname = new URL(url).pathname;
        setPagePathname(pathname);
        refreshPageCount(pathname);
        // eslint-disable-next-line no-empty
      } catch {}
    });
  }, []);

  const handleProviderChange = (newProvider: string) => {
    const provider = newProvider as ProviderEnum;
    const defaultModel = MODELS[provider]?.[0]?.value ?? '';
    updateSettings({ provider, model: defaultModel });
  };

  const handleClearPage = () => {
    if (!pagePathname) return;
    clearPageHistoriesApi(pagePathname).then(() => {
      setPageCount(0);
      refreshUsage();
    });
  };

  const handleClearAll = () => {
    clearAllHistoriesApi().then(() => {
      setPageCount(0);
      refreshUsage();
    });
  };

  if (!ready) return null;

  const usedPct = Math.min((usedBytes / limitBytes) * 100, 100);

  return (
    <ThemeWrapper>
      <div
        className="w-72 bg-white dark:bg-gray-950"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-300 dark:border-gray-600">
          <h1 className="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
            <img src="/icons/icon32.png" alt="Task Translator" className="w-4 h-4" />
            Task Translator
          </h1>
        </div>

        {/* Section 1: Page */}
        <div className="px-4 py-3 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-0.5 bg-gray-300 dark:bg-gray-600" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 whitespace-nowrap">
              Page
            </span>
            <div className="flex-1 h-0.5 bg-gray-300 dark:bg-gray-600" />
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Translations:{' '}
            <span className="font-semibold text-gray-800 dark:text-gray-100">{pageCount}</span>
          </p>

          {pageCount > 0 && (
            <ConfirmButton
              variant="contain"
              color="danger"
              size="md"
              fullWidth
              onConfirm={handleClearPage}
              confirmMessage="This will remove all saved translations for this page."
            >
              Clear page history
            </ConfirmButton>
          )}
        </div>

        {/* Section 2: Global */}
        <div className="px-4 py-3 space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-0.5 bg-gray-300 dark:bg-gray-600" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 whitespace-nowrap">
              Global
            </span>
            <div className="flex-1 h-0.5 bg-gray-300 dark:bg-gray-600" />
          </div>

          {/* Group: Settings */}
          <div className="space-y-3">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Settings</div>

            <Toggle
              label="Auto-show translations"
              checked={alwaysShowTranslated}
              onChange={(value) => updateSettings({ alwaysShowTranslated: value })}
            />

            <Toggle
              label="Dark mode"
              checked={theme === ThemeEnum.Dark}
              onChange={(value) =>
                updateSettings({ theme: value ? ThemeEnum.Dark : ThemeEnum.Light })
              }
            />

            <Toggle
              label="Show sidebar"
              checked={showSidebar}
              onChange={(value) => updateSettings({ showSidebar: value })}
            />

            <Select
              label="Your language"
              value={targetLanguage}
              options={LANGUAGES.map((lang) => ({ value: lang, label: lang }))}
              onChange={(targetLanguage) => updateSettings({ targetLanguage })}
            />

            <Select
              label="Provider"
              value={provider}
              options={PROVIDERS}
              onChange={handleProviderChange}
            />

            <Select
              label="Model"
              disabled
              value={model}
              options={MODELS[provider as ProviderEnum] ?? []}
              onChange={(model) => updateSettings({ model })}
            />
          </div>

          {/* Group: Usage */}
          <div className="space-y-2.5">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Usage</div>

            <div>
              <div
                className={clsx(
                  'w-full h-1.5 rounded-full overflow-hidden',
                  'bg-gray-100',
                  'dark:bg-gray-800'
                )}
              >
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${usedPct}%` }}
                />
              </div>
              <div className="flex justify-end mt-1">
                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                  {toMB(usedBytes)} MB / {toMB(limitBytes)} MB
                </span>
              </div>
            </div>

            <ConfirmButton
              variant="contain"
              color="danger"
              size="md"
              fullWidth
              onConfirm={handleClearAll}
              confirmMessage="This will permanently delete all saved translations across all pages."
            >
              Clear all history
            </ConfirmButton>
          </div>
        </div>
      </div>
    </ThemeWrapper>
  );
};
