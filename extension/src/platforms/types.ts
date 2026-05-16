// types.ts — Platform adapter interfaces for multi-platform support

import type { BlockTypeEnum } from '../enums';
import type { ContextBlock } from '../types';

export interface PlatformBlock {
  blockType: BlockTypeEnum;
  containerEl: HTMLElement;
  contentEl: HTMLElement;
  attachedContentEls?: HTMLElement[];
  // Re-queries the live DOM — use when the element may be replaced by framework re-renders
  getLiveElement?: () => HTMLElement | null;
  getLiveAttachedElements?: () => HTMLElement[];
  getContextBlocks?: () => ContextBlock[];
}

export interface PlatformAdapter {
  name: string;
  pagePattern: RegExp;
  getBlocks: () => PlatformBlock[];
}
