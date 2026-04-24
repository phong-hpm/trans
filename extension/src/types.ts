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

export type BlockType = 'title' | 'task' | 'comment';

export interface ContextBlock {
  type: BlockType;
  text: string;
}

export interface TranslateSegment {
  id: string;
  text: string;
}

export interface TranslateRequest {
  blockType: BlockType;
  segments: TranslateSegment[];
  contextBlocks?: ContextBlock[];
  targetLanguage: string;
  provider: string;
  model: string;
}

export interface TranslateResponse {
  segments: { id: string; text: string; translatedText: string }[];
}

export type Theme = 'light' | 'dark';

export interface ExtensionSettings {
  targetLanguage: string;
  backendUrl: string;
  provider: string;
  model: string;
  alwaysShowTranslated: boolean;
  theme: Theme;
}
