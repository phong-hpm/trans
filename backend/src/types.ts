// types.ts — Shared request/response types for the translation API

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
