// Popup.tsx — Extension popup: language settings, provider/model, always-show toggle, clear cache

import type React from 'react';
import { useEffect, useState } from 'react';
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
    <div className="w-72 p-4 font-sans bg-white" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <h1 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-1.5">
        <img src="/icons/icon32.png" alt="GitHub Translator" className="w-4 h-4" />
        GitHub Translator
      </h1>

      <div className="space-y-3">
        {/* Your language */}
        <div>
          <div className="block text-xs font-medium text-gray-600 mb-1">Your language</div>
          <select
            value={settings.targetLanguage}
            onChange={(e) => setSettings({ ...settings, targetLanguage: e.target.value })}
            className="w-full text-sm border border-gray-300 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        {/* Provider */}
        <div>
          <div className="block text-xs font-medium text-gray-600 mb-1">Provider</div>
          <select
            value={settings.provider}
            onChange={(e) => handleProviderChange(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Model */}
        <div>
          <div className="block text-xs font-medium text-gray-600 mb-1">Model</div>
          <select
            value={settings.model}
            onChange={(e) => setSettings({ ...settings, model: e.target.value })}
            className="w-full text-sm border border-gray-300 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {(MODELS[settings.provider] ?? []).map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Backend URL */}
        <div>
          <div className="block text-xs font-medium text-gray-600 mb-1">Backend URL</div>
          <input
            type="url"
            value={settings.backendUrl}
            onChange={(e) => setSettings({ ...settings, backendUrl: e.target.value })}
            placeholder="http://localhost:8000/api/v1"
            className="w-full text-sm border border-gray-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Always show translated toggle */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <div className="text-xs font-medium text-gray-700">Always show translated</div>
            <div className="text-xs text-gray-400 mt-0.5">
              Auto-apply cached translations on page load
            </div>
          </div>
          <Toggle checked={settings.alwaysShowTranslated} onChange={handleToggleAlwaysShow} />
        </div>

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
