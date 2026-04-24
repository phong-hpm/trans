// Popup.tsx — Extension popup: language settings, provider/model, always-show toggle, clear cache

import type React from 'react';
import { useEffect, useState } from 'react';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Toggle } from '../components/Toggle';
import { LANGUAGES } from '../constants/languages';
import { MODELS, PROVIDERS } from '../constants/providers';
import { DEFAULT_SETTINGS } from '../constants/settings';
import type { ExtensionSettings } from '../types';

export const Popup: React.FC = () => {
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [hasPageCache, setHasPageCache] = useState(false);
  const [pagePathname, setPagePathname] = useState('');

  useEffect(() => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
      setSettings(items as ExtensionSettings);
    });
  }, []);

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

  const handleProviderChange = (provider: string) => {
    const defaultModel = MODELS[provider]?.[0]?.value ?? '';
    setSettings((s) => ({ ...s, provider, model: defaultModel }));
  };

  const handleToggleAlwaysShow = (value: boolean) => {
    const updated = { ...settings, alwaysShowTranslated: value };
    setSettings(updated);
    chrome.storage.sync.set({ alwaysShowTranslated: value });
  };

  const handleSave = () => {
    chrome.storage.sync.set(settings, () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const handleClearCache = () => {
    if (!pagePathname) return;
    const prefix = `trans:${pagePathname}:`;
    chrome.storage.local.get(null, (all) => {
      const keys = Object.keys(all).filter((k) => k.startsWith(prefix));
      chrome.storage.local.remove(keys, () => setHasPageCache(false));
    });
  };

  return (
    <div className="w-72 p-4 bg-white" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <h1 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-1.5">
        <img src="/icons/icon32.png" alt="Task Translator" className="w-4 h-4" />
        Task Translator
      </h1>

      <div className="space-y-3">
        <Select
          label="Your language"
          value={settings.targetLanguage}
          options={LANGUAGES.map((lang) => ({ value: lang, label: lang }))}
          onChange={(lang) => setSettings({ ...settings, targetLanguage: lang })}
        />

        <Select
          label="Provider"
          value={settings.provider}
          options={PROVIDERS}
          onChange={handleProviderChange}
        />

        <Select
          label="Model"
          value={settings.model}
          options={MODELS[settings.provider] ?? []}
          onChange={(model) => setSettings({ ...settings, model })}
        />

        <Input
          label="Backend URL"
          type="url"
          value={settings.backendUrl}
          onChange={(e) => setSettings({ ...settings, backendUrl: e.target.value })}
          placeholder="http://localhost:8000/api/v1"
        />

        <Toggle
          label="Always show translated"
          sublabel="Auto-apply cached translations on page load"
          checked={settings.alwaysShowTranslated}
          onChange={handleToggleAlwaysShow}
        />

        <div className="border-t border-gray-100 pt-3 space-y-2">
          <button
            type="button"
            onClick={handleSave}
            className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium rounded-md transition-colors"
          >
            {saved ? '✓ Saved' : 'Save Settings'}
          </button>

          {hasPageCache && (
            <button
              type="button"
              onClick={handleClearCache}
              className="w-full py-1.5 px-3 bg-white hover:bg-red-50 text-red-500 border border-red-200 text-sm font-medium rounded-md transition-colors"
            >
              Clear all page translations
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
