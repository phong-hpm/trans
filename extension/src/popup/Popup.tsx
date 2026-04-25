// Popup.tsx — Extension popup: language settings, provider/model, always-show toggle, clear cache

import type React from 'react';
import { useEffect, useState } from 'react';
import { Select } from '../components/Select';
import { Toggle } from '../components/Toggle';
import { LANGUAGES } from '../constants/languages';
import { MODELS, PROVIDERS } from '../constants/providers';
import { useGlobalStore } from '../store/global';

export const Popup: React.FC = () => {
  const { ready, theme, targetLanguage, provider, model, alwaysShowTranslated, updateSettings, patchSettings, saveSettings } = useGlobalStore();

  const [saved, setSaved] = useState(false);
  const [hasPageCache, setHasPageCache] = useState(false);
  const [pagePathname, setPagePathname] = useState('');

  // Check if current page has any cached translations
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs[0]?.url;
      if (!url) return;
      try {
        const pathname = new URL(url).pathname;
        setPagePathname(pathname);
        const prefix = `trans:${pathname}:`;
        chrome.storage.local.get(null, (all) => {
          setHasPageCache(Object.keys(all).some((k) => k.startsWith(prefix)));
        });
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

  const handleClearCache = () => {
    if (!pagePathname) return;
    const prefix = `trans:${pagePathname}:`;
    chrome.storage.local.get(null, (all) => {
      const keys = Object.keys(all).filter((k) => k.startsWith(prefix));
      chrome.storage.local.remove(keys, () => setHasPageCache(false));
    });
  };

  if (!ready) return null;

  const isDark = theme === 'dark';

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="w-72 p-4 bg-white dark:bg-gray-950" style={{ fontFamily: 'system-ui, sans-serif' }}>
        <h1 className='text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-1.5'>
          <img src='/icons/icon32.png' alt='Task Translator' className='w-4 h-4' />
          Task Translator
        </h1>

        <div className='space-y-3'>
          <div className='border-b border-gray-100 dark:border-gray-700 pb-3 space-y-3'>
            <Toggle
              label='Always show translated'
              sublabel='Auto-apply cached translations on page load'
              checked={alwaysShowTranslated}
              onChange={(value) => patchSettings({ alwaysShowTranslated: value })}
            />

            <Toggle
              label='Dark mode'
              checked={isDark}
              onChange={(value) => patchSettings({ theme: value ? 'dark' : 'light' })}
            />
          </div>

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

          <div className='space-y-2'>
            <button
              type='button'
              onClick={handleSave}
              className='w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium rounded-md transition-colors'
            >
              {saved ? '✓ Saved' : 'Save Settings'}
            </button>

            {hasPageCache && (
              <button
                type='button'
                onClick={handleClearCache}
                className='w-full py-1.5 px-3 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 border border-red-200 dark:border-red-800 text-sm font-medium rounded-md transition-colors'
              >
                Clear all page translations
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
