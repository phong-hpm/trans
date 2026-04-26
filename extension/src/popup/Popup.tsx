// Popup.tsx — Extension popup: language settings, provider/model, always-show toggle, clear cache

import clsx from 'clsx';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { Confirm } from '../components/Confirm';
import { Select } from '../components/Select';
import { Toggle } from '../components/Toggle';
import { LANGUAGES } from '../constants/languages';
import { MODELS, PROVIDERS } from '../constants/providers';
import { Theme } from '../types';
import { useGlobalStore } from '../store/global';

const toMB = (bytes: number) => (bytes / (1024 * 1024)).toFixed(2);

export const Popup: React.FC = () => {
  const { ready, theme, targetLanguage, provider, model, alwaysShowTranslated, showSidebar, updateSettings, patchSettings, saveSettings } = useGlobalStore();

  const [saved, setSaved] = useState(false);
  const [pagePathname, setPagePathname] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [usedBytes, setUsedBytes] = useState(0);
  const [pendingClear, setPendingClear] = useState<'page' | 'all' | null>(null);

  const limitBytes = chrome.storage.local.QUOTA_BYTES;

  const refreshUsage = () => {
    chrome.storage.local.getBytesInUse(null, setUsedBytes);
  };

  const refreshPageCount = (pathname: string) => {
    const prefix = `trans:${pathname}:`;
    chrome.storage.local.get(null, (all) => {
      setPageCount(Object.keys(all).filter((k) => k.startsWith(prefix)).length);
    });
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
      } catch {}
    });
  }, []);

  const handleProviderChange = (newProvider: string) => {
    const defaultModel = MODELS[newProvider]?.[0]?.value ?? '';
    updateSettings({ provider: newProvider, model: defaultModel });
  };

  const handleSave = () => {
    saveSettings();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearPage = () => {
    if (!pagePathname) return;
    const prefix = `trans:${pagePathname}:`;
    chrome.storage.local.get(null, (all) => {
      const keys = Object.keys(all).filter((k) => k.startsWith(prefix));
      chrome.storage.local.remove(keys, () => {
        setPageCount(0);
        refreshUsage();
        setPendingClear(null);
      });
    });
  };

  const handleClearAll = () => {
    chrome.storage.local.get(null, (all) => {
      const keys = Object.keys(all).filter((k) => k.startsWith('trans:'));
      chrome.storage.local.remove(keys, () => {
        setPageCount(0);
        refreshUsage();
        setPendingClear(null);
      });
    });
  };

  if (!ready) return null;

  const usedPct = Math.min((usedBytes / limitBytes) * 100, 100);

  return (
    <div className={theme.themeClass}>
      <div className='w-72 bg-white dark:bg-gray-950' style={{ fontFamily: 'system-ui, sans-serif' }}>

        {/* Header */}
        <div className='px-4 pt-4 pb-3 border-b border-gray-300 dark:border-gray-600'>
          <h1 className='text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-1.5'>
            <img src='/icons/icon32.png' alt='Task Translator' className='w-4 h-4' />
            Task Translator
          </h1>
        </div>

        {/* Section 1: Page */}
        <div className='px-4 py-3 space-y-2.5'>
          <div className='flex items-center gap-2'>
            <div className='flex-1 h-0.5 bg-gray-300 dark:bg-gray-600' />
            <span className='text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 whitespace-nowrap'>Page</span>
            <div className='flex-1 h-0.5 bg-gray-300 dark:bg-gray-600' />
          </div>

          <p className='text-xs text-gray-500 dark:text-gray-400'>
            Translations:{' '}
            <span className='font-semibold text-gray-800 dark:text-gray-100'>{pageCount}</span>
          </p>

          {pageCount > 0 && (
            pendingClear === 'page' ? (
              <div className='space-y-1.5'>
                <p className='text-xs text-amber-600 dark:text-amber-400'>
                  This will remove all saved translations for this page.
                </p>
                <Confirm onConfirm={handleClearPage} onCancel={() => setPendingClear(null)} />
              </div>
            ) : (
              <Button variant='danger' size='md' fullWidth onClick={() => setPendingClear('page')}>
                Clear page history
              </Button>
            )
          )}
        </div>

        {/* Section 2: Global */}
        <div className='px-4 py-3 space-y-4'>
          <div className='flex items-center gap-2'>
            <div className='flex-1 h-0.5 bg-gray-300 dark:bg-gray-600' />
            <span className='text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 whitespace-nowrap'>Global</span>
            <div className='flex-1 h-0.5 bg-gray-300 dark:bg-gray-600' />
          </div>

          {/* Group: Settings */}
          <div className='space-y-3'>
            <div className='text-xs font-medium text-gray-500 dark:text-gray-400'>Settings</div>

            <Toggle
              label='Auto-show translations'
              checked={alwaysShowTranslated}
              onChange={(value) => patchSettings({ alwaysShowTranslated: value })}
            />

            <Toggle
              label='Dark mode'
              checked={theme.isDark}
              onChange={(value) => patchSettings({ theme: value ? Theme.Dark : Theme.Light })}
            />

            <Toggle
              label='Show sidebar'
              checked={showSidebar}
              onChange={(value) => patchSettings({ showSidebar: value })}
            />

            <Select
              label='Your language'
              value={targetLanguage}
              options={LANGUAGES.map((lang) => ({ value: lang, label: lang }))}
              onChange={(targetLanguage) => updateSettings({ targetLanguage })}
            />

            <Select
              label='Provider'
              value={provider}
              options={PROVIDERS}
              onChange={handleProviderChange}
            />

            <Select
              label='Model'
              disabled
              value={model}
              options={MODELS[provider] ?? []}
              onChange={(model) => updateSettings({ model })}
            />

            <Button variant='primary' size='md' fullWidth onClick={handleSave}>
              {saved ? '✓ Saved' : 'Save Settings'}
            </Button>
          </div>

          {/* Group: Usage */}
          <div className='space-y-2.5'>
            <div className='text-xs font-medium text-gray-500 dark:text-gray-400'>Usage</div>

            <div>
              <div className={clsx(
                'w-full h-1.5 rounded-full overflow-hidden',
                'bg-gray-100',
                'dark:bg-gray-800',
              )}>
                <div
                  className='h-full bg-blue-500 rounded-full transition-all duration-300'
                  style={{ width: `${usedPct}%` }}
                />
              </div>
              <div className='flex justify-end mt-1'>
                <span className='text-[10px] text-gray-400 dark:text-gray-500'>
                  {toMB(usedBytes)} MB / {toMB(limitBytes)} MB
                </span>
              </div>
            </div>

            {pendingClear === 'all' ? (
              <div className='space-y-1.5'>
                <p className='text-xs text-amber-600 dark:text-amber-400'>
                  This will permanently delete all saved translations across all pages.
                </p>
                <Confirm onConfirm={handleClearAll} onCancel={() => setPendingClear(null)} />
              </div>
            ) : (
              <Button variant='danger' size='md' fullWidth onClick={() => setPendingClear('all')}>
                Clear all history
              </Button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
