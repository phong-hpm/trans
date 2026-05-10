// store/global.ts — Central Zustand store: settings flattened for direct access via useGlobalStore()

import { create } from 'zustand';

import { getSettingsApi, saveSettingsApi, subscribeSettingsChangesApi } from '../apis/syncApi';
import { DEFAULT_SETTINGS } from '../constants/settings';
import { SidebarTabEnum } from '../enums';
import type { ExtensionSettings } from '../types';

interface GlobalStore extends ExtensionSettings {
  ready: boolean;
  focusedParsedContent: string | null;
  showModal: boolean;
  activeSidebarTab: SidebarTabEnum;
  platformName: string | null;
  // Load from storage + subscribe to live changes — call once per context
  init: () => void;
  // Update local state + immediately persist to storage
  updateSettings: (partial: Partial<ExtensionSettings>) => void;
  // Open sidebar and scroll to a specific block in the History tab
  openSidebarToBlock: (parsedContent: string) => void;
  // Open sidebar directly to the settings tab
  openSettingsPanel: () => void;
  // Switch the currently visible sidebar tab
  setSidebarTab: (tab: SidebarTabEnum) => void;
  // Clear focused block after sidebar has scrolled to it
  clearFocusedBlock: () => void;
  // Open the settings modal
  openModal: () => void;
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
    activeSidebarTab: SidebarTabEnum.History,
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
      set({
        showSidebar: true,
        activeSidebarTab: SidebarTabEnum.History,
        focusedParsedContent: parsedContent,
      });
      saveSettingsApi({ showSidebar: true });
    },

    openSettingsPanel: () => {
      set({ showSidebar: true, activeSidebarTab: SidebarTabEnum.General });
      saveSettingsApi({ showSidebar: true });
    },

    setSidebarTab: (tab) => set({ activeSidebarTab: tab }),

    clearFocusedBlock: () => set({ focusedParsedContent: null }),
    openModal: () => set({ showModal: true }),
    toggleModal: () => set((s) => ({ showModal: !s.showModal })),
    setPlatformName: (name) => set({ platformName: name }),
  };
});
