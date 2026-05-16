// renderer/PlatformBlockToolbarRenderer.tsx — Mounts and manages per-block TranslateToolbar React roots

import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';

import { BLOCK_HOST_DATASET_KEY, BLOCK_HOST_SELECTOR } from '../../constants/dom';
import type { PlatformBlock } from '../../platforms/types';
import { TranslatableBlock } from '../block/TranslatableBlock';
import { TranslateToolbar } from '../components/TranslateToolbar';
import { createShadowHost } from '../dom/shadowDom';

export class PlatformBlockToolbarRenderer {
  private readonly blockRoots = new Map<HTMLElement, Root>();

  renderToolbarsForPlatformBlocks(blocks: PlatformBlock[]): void {
    this.removeInvalidToolbarsForPlatformBlocks();

    for (const platformBlock of blocks) {
      const anchor = this.createPlatformBlockAnchor(platformBlock);
      if (!anchor) continue;

      const translatableBlock = new TranslatableBlock(platformBlock);
      if (!translatableBlock.parsedContent) continue;

      this.renderToolbarIntoPlatformBlockAnchor({ anchor, platformBlock });
    }
  }

  private removeInvalidToolbarsForPlatformBlocks(): void {
    for (const [anchor, root] of this.blockRoots) {
      if (!anchor.isConnected) {
        root.unmount();
        this.blockRoots.delete(anchor);
      }
    }
  }

  private createPlatformBlockAnchor(platformBlock: PlatformBlock): HTMLElement | null {
    const contentParent = platformBlock.contentEl.parentElement;
    if (!contentParent) return null;
    if (contentParent.querySelector(BLOCK_HOST_SELECTOR)) return null;

    const anchor = document.createElement('div');
    contentParent.prepend(anchor);
    return anchor;
  }

  private renderToolbarIntoPlatformBlockAnchor({
    anchor,
    platformBlock,
  }: {
    anchor: HTMLElement;
    platformBlock: PlatformBlock;
  }): void {
    if (anchor.querySelector(BLOCK_HOST_SELECTOR)) return;

    const translatableBlock = new TranslatableBlock(platformBlock);
    const { host, mount } = createShadowHost('');
    host.dataset[BLOCK_HOST_DATASET_KEY] = translatableBlock.parsedContent.slice(0, 40);

    const root = createRoot(mount);
    root.render(<TranslateToolbar platformBlock={platformBlock} />);
    this.blockRoots.set(anchor, root);
    anchor.appendChild(host);
  }
}
