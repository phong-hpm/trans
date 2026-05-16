// block/TranslatableBlock.ts — Normalized accessor wrapper over a raw platform PlatformBlock.
// All getters re-query the live DOM on every call — never snapshot element references.

import type { BlockTypeEnum } from '../../enums';
import type { PlatformBlock } from '../../platforms/types';
import type { ContextBlock } from '../../types';
import { getParsedContentsDom } from '../dom/textDom';

export class TranslatableBlock {
  constructor(private readonly platformBlock: PlatformBlock) {}

  get blockType(): BlockTypeEnum {
    return this.platformBlock.blockType;
  }

  get element(): HTMLElement {
    return this.platformBlock.getLiveElement?.() ?? this.platformBlock.contentEl;
  }

  get elements(): HTMLElement[] {
    const primary = this.element;
    const attached =
      this.platformBlock.getLiveAttachedElements?.() ?? this.platformBlock.attachedContentEls ?? [];
    return [...attached, primary].filter((el, index, all) => all.indexOf(el) === index);
  }

  get contextBlocks(): ContextBlock[] {
    return this.platformBlock.getContextBlocks?.() ?? [];
  }

  get containerEl(): HTMLElement {
    return this.platformBlock.containerEl;
  }

  get parsedContent(): string {
    const els = [...(this.platformBlock.attachedContentEls ?? []), this.platformBlock.contentEl];
    return getParsedContentsDom(els);
  }
}
