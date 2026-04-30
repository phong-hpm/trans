// types.ts — TranslationProvider interface

import type { BlockType, ContextBlock, TranslateSegment } from '@/types';

export interface TranslateProviderParams {
  segments: TranslateSegment[];
  contextBlocks?: ContextBlock[];
  targetLanguage: string;
  model: string;
  userContext?: string;
}

export interface BatchTranslateProviderBlock {
  blockType: BlockType;
  segments: TranslateSegment[];
  contextBlocks?: ContextBlock[];
}

export interface BatchTranslateProviderParams {
  blocks: BatchTranslateProviderBlock[];
  targetLanguage: string;
  model: string;
  userContext?: string;
}

export interface TranslationProvider {
  translate(params: TranslateProviderParams): Promise<{ id: string; translatedText: string }[]>;
  /** Translates all blocks in one LLM call. Returns a flat array of all translated segments. */
  translateBatch(
    params: BatchTranslateProviderParams
  ): Promise<{ id: string; translatedText: string }[]>;
}
