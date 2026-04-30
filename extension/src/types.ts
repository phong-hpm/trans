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
 * Extends TranslateRequest with the message type discriminator.
 * backendUrl is NOT included — the background service worker reads it from its own ENV.
 */
export interface BackgroundTranslateMessage extends TranslateRequest {
  type: string;
}

// ─── Batch translate ──────────────────────────────────────────────────────────

export interface BatchTranslateBlock {
  blockType: BlockTypeEnum;
  segments: { id: string; text: string }[];
  contextBlocks?: ContextBlock[];
}

export interface BackgroundBatchTranslateMessage {
  type: string;
  blocks: BatchTranslateBlock[];
  targetLanguage: string;
  provider: string;
  model: string;
  userContext?: string;
}

export interface BatchTranslateResponse {
  /** Results in the same order as the input blocks array. */
  blocks: { segments: { id: string; text: string; translatedText: string }[] }[];
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
