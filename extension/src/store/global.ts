// store/global.ts — Central Zustand store: settings flattened for direct access via useGlobalStore()

import { create } from 'zustand';
import { DEFAULT_SETTINGS } from '../constants/settings';
import { Theme } from '../types';
import type { ExtensionSettings } from '../types';

// ThemeState expands the raw Theme enum value into derived helpers.
// Storage always persists the raw Theme value; only the store uses ThemeState.
export interface ThemeState {
  theme: Theme;
  isDark: boolean;
  themeClass: string; // 'dark' | ''
}

const buildTheme = (value: Theme): ThemeState => ({
  theme: value,
  isDark: value === Theme.Dark,
  themeClass: value === Theme.Dark ? 'dark' : '',
});

// Convert a Partial<ExtensionSettings> patch into a store-compatible object
const toStorePatch = (
  partial: Partial<ExtensionSettings>,
): Partial<Omit<GlobalStore, 'theme'> & { theme: ThemeState }> => {
  const { theme, ...rest } = partial;
  return theme !== undefined ? { ...rest, theme: buildTheme(theme) } : rest;
};

interface GlobalStore extends Omit<ExtensionSettings, 'theme'> {
  theme: ThemeState;
  ready: boolean;
  focusedBlockId: string | null;
  // Load from storage + subscribe to live changes — call once per context
  init: () => void;
  // Update local state only — pending until saveSettings()
  updateSettings: (partial: Partial<ExtensionSettings>) => void;
  // Update local state + immediately persist to storage (for toggles)
  patchSettings: (partial: Partial<ExtensionSettings>) => void;
  // Persist current settings to storage (for Save button)
  saveSettings: () => void;
  // Open sidebar and scroll to a specific block in the History tab
  openSidebarToBlock: (blockId: string) => void;
  // Clear focused block after sidebar has scrolled to it
  clearFocusedBlock: () => void;
}

export const useGlobalStore = create<GlobalStore>((set, get) => ({
  ...DEFAULT_SETTINGS,
  theme: buildTheme(DEFAULT_SETTINGS.theme),
  ready: false,
  focusedBlockId: null,

  init: () => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
      set({ ...toStorePatch(items as ExtensionSettings), ready: true });
    });

    chrome.storage.onChanged.addListener((changes) => {
      const patch = Object.fromEntries(
        Object.entries(changes)
          .filter(([key]) => key in DEFAULT_SETTINGS)
          .map(([key, change]) => [key, change.newValue]),
      ) as Partial<ExtensionSettings>;
      if (Object.keys(patch).length) set(toStorePatch(patch));
    });
  },

  updateSettings: (partial) => set(toStorePatch(partial)),

  patchSettings: (partial) => {
    set(toStorePatch(partial));
    chrome.storage.sync.set(partial);
  },

  saveSettings: () => {
    const { targetLanguage, provider, model, alwaysShowTranslated, theme, showSidebar, sidebarMode } = get();
    chrome.storage.sync.set({
      targetLanguage,
      provider,
      model,
      alwaysShowTranslated,
      theme: theme.theme, // serialize ThemeState → raw Theme enum value for storage
      showSidebar,
      sidebarMode,
    });
  },

  openSidebarToBlock: (blockId) => {
    set({ showSidebar: true, focusedBlockId: blockId });
    chrome.storage.sync.set({ showSidebar: true });
  },

  clearFocusedBlock: () => set({ focusedBlockId: null }),
}));
