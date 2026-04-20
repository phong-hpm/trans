// types.ts — Shared request/response types for the translation API

export interface TranslateSegment {
  id: string;
  text: string;
}

export interface TranslateRequest {
  segments: TranslateSegment[];
  targetLanguage: string;
  provider: 'openai' | 'gemini';
  model: string;
}

export interface TranslatedSegment {
  id: string;
  text: string;
  translatedText: string;
}

export interface TranslateResponse {
  segments: TranslatedSegment[];
}
