// types.ts — Shared TypeScript types across content script and popup

export interface TranslateRequest {
  text: string;
  targetLanguage: string;
}

export interface TranslateResponse {
  translatedText: string;
}

export interface ExtensionSettings {
  targetLanguage: string;
  backendUrl: string;
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
  targetLanguage: 'Vietnamese',
  backendUrl: 'http://localhost:8000',
};
