// types.ts — Platform adapter interfaces for multi-platform support

import type { BlockTypeEnum } from '../enums';
import type { ContextBlock } from '../types';

export interface Block {
  blockId: string;
  blockType: BlockTypeEnum;
  containerEl: HTMLElement;
  contentEl: HTMLElement;
  getContextBlocks?: () => ContextBlock[];
}

export interface PlatformAdapter {
  name: string;
  pagePattern: RegExp;
  getBlocks: () => Block[];
}
