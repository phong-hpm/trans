// types.ts — TranslationProvider interface

import type { ContextBlock, TranslateSegment } from '@/types';

export interface TranslateProviderParams {
  segments: TranslateSegment[];
  contextBlocks?: ContextBlock[];
  targetLanguage: string;
  model: string;
  userContext?: string;
}

export interface TranslationProvider {
  translate(params: TranslateProviderParams): Promise<{ id: string; translatedText: string }[]>;
}
