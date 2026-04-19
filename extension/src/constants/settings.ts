// settings.ts — Default extension settings, DEV/PROD aware

import { IS_DEV } from './env';
import type { ExtensionSettings } from '../types';

export const DEFAULT_SETTINGS: ExtensionSettings = {
  targetLanguage: 'Vietnamese',
  backendUrl: IS_DEV ? 'http://localhost:8000' : '',
};
