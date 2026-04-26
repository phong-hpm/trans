// settings.ts — Default extension settings

import { ModelEnum, ProviderEnum, SidebarModeEnum, ThemeEnum } from '../enums';
import type { ExtensionSettings } from '../types';

export const DEFAULT_SETTINGS: ExtensionSettings = {
  targetLanguage: 'English',
  provider: ProviderEnum.OpenAI,
  model: ModelEnum.GPT4oMini,
  userContext: '',
  alwaysShowTranslated: false,
  theme: ThemeEnum.Light,
  showSidebar: false,
  sidebarMode: SidebarModeEnum.Drawer,
};
