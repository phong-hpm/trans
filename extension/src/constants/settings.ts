// settings.ts — Default extension settings, DEV/PROD aware

import ENV from './env';
import type { ExtensionSettings } from '../types';

export const DEFAULT_SETTINGS: ExtensionSettings = {
  targetLanguage: 'Vietnamese',
  backendUrl: ENV.isDev ? 'http://localhost:8000' : '',
};
