// store/global.ts — Zustand global store: nested settings + sidebar focus coordination state

import { create } from 'zustand';

import { saveSettingsApi } from '../apis/syncApi';
import { DEFAULT_SETTINGS } from '../constants/settings';
import type { ExtensionSettings } from '../types';

interface GlobalStore {
  settings: ExtensionSettings;
  updateSettings: (partial: Partial<ExtensionSettings>) => void;
  setShowSidebar: (show: boolean) => void;

  ready: boolean;

  focusedParsedContent: string | null;
  setFocusedParsedContent: (parsedContent: string | null) => void;
}

export const useGlobalStore = create<GlobalStore>((set) => {
  return {
    settings: DEFAULT_SETTINGS,

    updateSettings: (partial) => {
      set((state) => ({ settings: { ...state.settings, ...partial } }));
      saveSettingsApi(partial);
    },

    setShowSidebar: (show) => {
      set((state) => ({ settings: { ...state.settings, showSidebar: show } }));
      saveSettingsApi({ showSidebar: show });
    },

    ready: false,

    focusedParsedContent: null,

    setFocusedParsedContent: (parsedContent) => {
      set({ focusedParsedContent: parsedContent });
    },
  };
});
