// store/global.ts — Central Zustand store: settings flattened for direct access via useGlobalStore()

import { create } from 'zustand';
import { DEFAULT_SETTINGS } from '../constants/settings';
import type { ExtensionSettings } from '../types';

interface GlobalStore extends ExtensionSettings {
  ready: boolean;
  // Load from storage + subscribe to live changes — call once per context
  init: () => void;
  // Update local state only — pending until saveSettings()
  updateSettings: (partial: Partial<ExtensionSettings>) => void;
  // Update local state + immediately persist to storage (for toggles)
  patchSettings: (partial: Partial<ExtensionSettings>) => void;
  // Persist current settings to storage (for Save button)
  saveSettings: () => void;
}

export const useGlobalStore = create<GlobalStore>((set, get) => ({
  ...DEFAULT_SETTINGS,
  ready: false,

  init: () => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
      set({ ...(items as ExtensionSettings), ready: true });
    });

    chrome.storage.onChanged.addListener((changes) => {
      const patch = Object.fromEntries(
        Object.entries(changes)
          .filter(([key]) => key in DEFAULT_SETTINGS)
          .map(([key, change]) => [key, change.newValue]),
      );
      if (Object.keys(patch).length) set(patch as Partial<ExtensionSettings>);
    });
  },

  updateSettings: (partial) => set(partial),

  patchSettings: (partial) => {
    set(partial);
    chrome.storage.sync.set(partial);
  },

  saveSettings: () => {
    const { targetLanguage, provider, model, alwaysShowTranslated, theme } = get();
    chrome.storage.sync.set({ targetLanguage, provider, model, alwaysShowTranslated, theme });
  },
}));
