// types.ts — Platform adapter interfaces for multi-platform support

import type { BlockType, ContextBlock } from '../types';

export interface Block {
  blockId: string;
  blockType: BlockType;
  containerEl: HTMLElement;
  contentEl: HTMLElement;
  getContextBlocks?: () => ContextBlock[];
}

export interface PlatformAdapter {
  pagePattern: RegExp;
  getBlocks: () => Block[];
}
