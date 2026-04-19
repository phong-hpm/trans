// types.ts — Shared TypeScript types and enums across extension bundles

export enum MessageType {
  Translate = 'TRANSLATE',
  DevLog = 'DEV_LOG',
}

export enum LogType {
  Call = 'call',
  Response = 'response',
  Error = 'error',
}

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
