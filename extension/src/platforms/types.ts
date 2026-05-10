// types.ts — Platform adapter interfaces for multi-platform support

import type { BlockTypeEnum } from '../enums';
import type { ContextBlock } from '../types';

export interface Block {
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
  getBlocks: () => Block[];
}

/** Normalized DOM access contract for a single translatable block.
 *  Platform-specific querying stays in the platform layer; React components
 *  and hooks only consume this stable interface. */
export interface BlockDomAccess {
  getElement: () => HTMLElement;
  getElements: () => HTMLElement[];
  getContextBlocks?: () => ContextBlock[];
  getContainerEl: () => HTMLElement;
}

/** Single typed target passed from the platform mounting layer into React.
 *  Replaces loose parsedContent / blockType / DOM-callback props. */
export interface BlockTranslationTarget {
  parsedContent: string;
  blockType: BlockTypeEnum;
  domAccess: BlockDomAccess;
}
