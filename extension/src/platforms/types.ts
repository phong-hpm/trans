// types.ts — Platform adapter interfaces for multi-platform support

import type { BlockTypeEnum } from '../enums';
import type { ContextBlock } from '../types';

export interface Block {
  blockType: BlockTypeEnum;
  containerEl: HTMLElement;
  contentEl: HTMLElement;
  // Re-queries the live DOM — use when the element may be replaced by framework re-renders
  getLiveElement?: () => HTMLElement | null;
  getContextBlocks?: () => ContextBlock[];
}

export interface PlatformAdapter {
  name: string;
  pagePattern: RegExp;
  getBlocks: () => Block[];
}
