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
  userContext?: string;
}

export interface TranslatedSegment {
  id: string;
  text: string;
  translatedText: string;
}

export interface TranslateResponse {
  segments: TranslatedSegment[];
}

// ─── Batch translate ───────────────────────────────────────────────────────────

export interface BatchBlock {
  blockType: BlockType;
  segments: TranslateSegment[];
  contextBlocks?: ContextBlock[];
}

export interface BatchTranslateRequest {
  blocks: BatchBlock[];
  targetLanguage: string;
  provider: string;
  model: string;
  userContext?: string;
}

export interface BatchTranslateResponse {
  /** Results in the same order as the input blocks array. */
  blocks: { segments: TranslatedSegment[] }[];
}
