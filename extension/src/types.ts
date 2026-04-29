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
  userContext?: string;
}

/**
 * Message shape sent from content script → background service worker.
 * Extends TranslateRequest with routing fields that the background needs but the backend does not.
 */
export interface BackgroundTranslateMessage extends TranslateRequest {
  type: string;
  backendUrl: string;
}

export interface TranslateResponse {
  segments: { id: string; text: string; translatedText: string }[];
}

export interface TranslationEntry {
  id: string;
  segments: { text: string; translatedText: string }[];
  createdAt: number;
  selected: boolean;
}

export interface BlockHistory {
  // id is optional — the backend does not return it; extension assigns one on first save
  id?: string;
  pageUrl: string;
  parsedContent: string;
  entries: TranslationEntry[];
}

export interface ExtensionSettings {
  targetLanguage: string;
  provider: string;
  model: string;
  userContext: string;
  alwaysShowTranslated: boolean;
  autoTranslateTask: boolean;
  autoTranslateAll: boolean;
  syncToDb: boolean;
  theme: ThemeEnum;
  showSidebar: boolean;
  sidebarMode: SidebarModeEnum;
}
