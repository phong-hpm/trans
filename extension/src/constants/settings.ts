// settings.ts — Default extension settings

import type { ExtensionSettings } from '../types';
import { SidebarModeEnum, Theme } from '../types';

export const DEFAULT_SETTINGS: ExtensionSettings = {
  targetLanguage: 'English',
  provider: 'openai',
  model: 'gpt-4o-mini',
  alwaysShowTranslated: false,
  theme: Theme.Light,
  showSidebar: false,
  sidebarMode: SidebarModeEnum.Drawer,
};
