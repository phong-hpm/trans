// settings.ts — Default extension settings

import type { ExtensionSettings } from '../types';
import ENV from './env';

export const DEFAULT_SETTINGS: ExtensionSettings = {
  targetLanguage: 'English',
  backendUrl: ENV.backendUrl,
  provider: 'openai',
  model: 'gpt-4o-mini',
  alwaysShowTranslated: false,
  theme: 'light',
};
