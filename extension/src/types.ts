// types.ts — Shared TypeScript types across content script and popup

export interface TranslateSegment {
  id: string;
  text: string;
}

export interface TranslateRequest {
  segments: TranslateSegment[];
  targetLanguage: string;
}

export interface TranslateResponse {
  segments: { id: string; translatedText: string }[];
}

export interface ExtensionSettings {
  targetLanguage: string;
  backendUrl: string;
}
