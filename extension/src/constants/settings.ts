// settings.ts — Default extension settings

import type { ExtensionSettings } from '../types';
import ENV from './env';

export const DEFAULT_SETTINGS: ExtensionSettings = {
  targetLanguage: 'Vietnamese',
  backendUrl: ENV.backendUrl,
  provider: 'gemini',
  model: 'gemini-2.5-flash',
  alwaysShowTranslated: false,
  theme: 'light',
};
