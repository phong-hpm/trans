// settings.ts — Settings cache singleton for content scripts

import ENV from '../constants/env';
import { DEFAULT_SETTINGS } from '../constants/settings';
import type { ExtensionSettings } from '../types';

let cache: ExtensionSettings | null = null;

export const getSettings = (): Promise<ExtensionSettings> => {
  if (cache) return Promise.resolve(cache);
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
      const settings = items as ExtensionSettings;
      if (ENV.isDev) settings.backendUrl = DEFAULT_SETTINGS.backendUrl;
      cache = settings;
      resolve(cache);
    });
  });
};

chrome.storage.onChanged.addListener(() => {
  cache = null;
});
