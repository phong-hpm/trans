// settings.ts — Default extension settings

import type { ExtensionSettings } from '../types';

export const DEFAULT_SETTINGS: ExtensionSettings = {
  targetLanguage: 'English',
  provider: 'openai',
  model: 'gpt-4o-mini',
  alwaysShowTranslated: false,
  theme: 'light',
};
