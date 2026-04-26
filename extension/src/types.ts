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

export enum Theme {
  Light = 'light',
  Dark = 'dark',
}

export interface TranslationEntry {
  id: string;
  segments: { text: string; translatedText: string }[];
  createdAt: number;
  selected: boolean;
}

export interface BlockHistory {
  entries: TranslationEntry[];
}

export enum SidebarModeEnum {
  Drawer = 'drawer',
  Page = 'page',
}

export enum SidebarTabEnum {
  History = 'history',
}

export interface ExtensionSettings {
  targetLanguage: string;
  provider: string;
  model: string;
  alwaysShowTranslated: boolean;
  theme: Theme;
  showSidebar: boolean;
  sidebarMode: SidebarModeEnum;
}
