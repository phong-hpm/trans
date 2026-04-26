// store/global.ts — Central Zustand store: settings flattened for direct access via useGlobalStore()

import { create } from 'zustand';

import { getSettingsApi, saveSettingsApi, subscribeSettingsChangesApi } from '../apis/syncApi';
import { DEFAULT_SETTINGS } from '../constants/settings';
import type { ExtensionSettings } from '../types';

interface GlobalStore extends ExtensionSettings {
  ready: boolean;
  focusedBlockId: string | null;
  // Load from storage + subscribe to live changes — call once per context
  init: () => void;
  // Update local state + immediately persist to storage
  updateSettings: (partial: Partial<ExtensionSettings>) => void;
  // Open sidebar and scroll to a specific block in the History tab
  openSidebarToBlock: (blockId: string) => void;
  // Clear focused block after sidebar has scrolled to it
  clearFocusedBlock: () => void;
}

export const useGlobalStore = create<GlobalStore>((set) => ({
  ...DEFAULT_SETTINGS,
  ready: false,
  focusedBlockId: null,

  init: () => {
    getSettingsApi(DEFAULT_SETTINGS).then((items) => {
      set({ ...(items as ExtensionSettings), ready: true });
    });

    return subscribeSettingsChangesApi((changes) => {
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

  openSidebarToBlock: (blockId) => {
    set({ showSidebar: true, focusedBlockId: blockId });
    saveSettingsApi({ showSidebar: true });
  },

  clearFocusedBlock: () => set({ focusedBlockId: null }),
}));
