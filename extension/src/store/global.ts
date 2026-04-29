// store/global.ts — Central Zustand store: settings flattened for direct access via useGlobalStore()

import { create } from 'zustand';

import { getSettingsApi, saveSettingsApi, subscribeSettingsChangesApi } from '../apis/syncApi';
import { DEFAULT_SETTINGS } from '../constants/settings';
import type { ExtensionSettings } from '../types';

interface GlobalStore extends ExtensionSettings {
  ready: boolean;
  focusedParsedContent: string | null;
  showModal: boolean;
  platformName: string | null;
  // Load from storage + subscribe to live changes — call once per context
  init: () => void;
  // Update local state + immediately persist to storage
  updateSettings: (partial: Partial<ExtensionSettings>) => void;
  // Open sidebar and scroll to a specific block in the History tab
  openSidebarToBlock: (parsedContent: string) => void;
  // Clear focused block after sidebar has scrolled to it
  clearFocusedBlock: () => void;
  // Toggle the settings modal open/closed
  toggleModal: () => void;
  // Set detected platform name (null = unsupported page)
  setPlatformName: (name: string | null) => void;
}

export const useGlobalStore = create<GlobalStore>((set) => {
  // Holds the cleanup fn for the settings subscription — stored in closure so it can be
  // torn down on re-init without leaking module-level state
  let _settingsUnsub: (() => void) | null = null;

  return {
    ...DEFAULT_SETTINGS,
    ready: false,
    focusedParsedContent: null,
    showModal: false,
    platformName: null,

    init: () => {
      _settingsUnsub?.();
      getSettingsApi(DEFAULT_SETTINGS).then((items) => {
        set({ ...(items as ExtensionSettings), ready: true });
      });
      _settingsUnsub = subscribeSettingsChangesApi((changes) => {
        const patch = Object.fromEntries(
          Object.entries(changes)
            .filter(([key]) => key in DEFAULT_SETTINGS)
            .map(([key, change]) => [key, change.newValue])
        ) as Partial<ExtensionSettings>;
        if (Object.keys(patch).length) set(patch);
      });
    },

    updateSettings: (partial) => {
      set(partial);
      saveSettingsApi(partial);
    },

    // Could be split into setFocusedBlock + persistSidebarOpen if callers ever need
    // to focus a block without toggling sidebar visibility.
    openSidebarToBlock: (parsedContent) => {
      set({ showSidebar: true, focusedParsedContent: parsedContent });
      saveSettingsApi({ showSidebar: true });
    },

    clearFocusedBlock: () => set({ focusedParsedContent: null }),
    toggleModal: () => set((s) => ({ showModal: !s.showModal })),
    setPlatformName: (name) => set({ platformName: name }),
  };
});
