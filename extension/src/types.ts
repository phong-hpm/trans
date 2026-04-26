// types.ts — Shared TypeScript interfaces across extension bundles

import type { BlockTypeEnum, SidebarModeEnum, ThemeEnum } from './enums';

export interface ContextBlock {
  type: BlockTypeEnum;
  text: string;
}

export interface TranslateSegment {
  id: string;
  text: string;
}

export interface TranslateRequest {
  blockType: BlockTypeEnum;
  segments: TranslateSegment[];
  contextBlocks?: ContextBlock[];
  targetLanguage: string;
  provider: string;
  model: string;
}

export interface TranslateResponse {
  segments: { id: string; text: string; translatedText: string }[];
}

export interface TranslationEntry {
  id: string;
  blockId: string;
  pageId: string;
  segments: { text: string; translatedText: string }[];
  createdAt: number;
  selected: boolean;
}

export interface BlockHistory {
  blockId: string;
  pageId: string;
  entries: TranslationEntry[];
}

export interface ExtensionSettings {
  targetLanguage: string;
  provider: string;
  model: string;
  alwaysShowTranslated: boolean;
  theme: ThemeEnum;
  showSidebar: boolean;
  sidebarMode: SidebarModeEnum;
}
