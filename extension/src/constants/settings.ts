// settings.ts — Default extension settings

import ENV from './env';
import type { ExtensionSettings } from '../types';

export const DEFAULT_SETTINGS: ExtensionSettings = {
  targetLanguage: 'Vietnamese',
  backendUrl: ENV.backendUrl,
  provider: 'gemini',
  model: 'gemini-2.5-flash',
};
