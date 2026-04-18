// Popup.tsx — Extension popup for configuring target language and backend URL

import type React from 'react';
import { useEffect, useState } from 'react';
import { DEFAULT_SETTINGS, type ExtensionSettings } from '../types';

const LANGUAGES = [
  'Vietnamese',
  'English',
  'Japanese',
  'Korean',
  'Chinese (Simplified)',
  'Chinese (Traditional)',
  'French',
  'German',
  'Spanish',
  'Portuguese',
  'Russian',
  'Arabic',
];

export const Popup: React.FC = () => {
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
      setSettings(items as ExtensionSettings);
    });
  }, []);

  const handleSave = () => {
    chrome.storage.sync.set(settings, () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <div className="w-72 p-4 font-sans bg-white">
      <h1 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-1.5">
        <svg
          className="w-4 h-4 text-blue-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
        GitHub Translator
      </h1>

      <div className="space-y-3">
        <div>
          <div className="block text-xs font-medium text-gray-600 mb-1">Target Language</div>
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

        <div>
          <div className="block text-xs font-medium text-gray-600 mb-1">Backend URL</div>
          <input
            type="url"
            value={settings.backendUrl}
            onChange={(e) => setSettings({ ...settings, backendUrl: e.target.value })}
            placeholder="http://localhost:3000"
            className="w-full text-sm border border-gray-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-400 mt-1">The translation server URL</p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium rounded-md transition-colors"
        >
          {saved ? '✓ Saved' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};
