// settings.ts — Default extension settings, DEV/PROD aware

import type { ExtensionSettings } from '../types';

export const DEFAULT_SETTINGS: ExtensionSettings = {
  targetLanguage: 'Vietnamese',
  backendUrl: import.meta.env.DEV ? 'http://localhost:8000' : '',
};
