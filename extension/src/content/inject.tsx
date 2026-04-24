// inject.tsx — Generic Shadow DOM injection engine: mounts translate buttons onto platform blocks

import { createRoot } from 'react-dom/client';
import type { Block } from '../platforms/types';
import type { BlockType, ContextBlock } from '../types';
import { TranslateButton } from './components/TranslateButton';
import { getSettings } from './settings';
import shadowStyles from './shadow.css?inline';

const ANCHOR_STYLE = 'position:absolute;top:8px;right:-32px;z-index:9999;';

const mountButton = (
  anchor: HTMLElement,
  contentEl: HTMLElement,
  blockId: string,
  blockType: BlockType,
  getContextBlocks?: () => ContextBlock[],
): void => {
  if (anchor.querySelector(`[data-trans-id="${blockId}"]`)) return;

  const host = document.createElement('div');
  host.setAttribute('data-trans-id', blockId);

  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = shadowStyles;
  shadow.appendChild(style);

  const mount = document.createElement('div');
  shadow.appendChild(mount);

  createRoot(mount).render(
    <TranslateButton
      blockId={blockId}
      blockType={blockType}
      getSettings={getSettings}
      getElement={() => contentEl}
      getContextBlocks={getContextBlocks}
    />,
  );

  anchor.appendChild(host);
};

const makeAnchor = (parent: HTMLElement, blockId: string): HTMLElement | null => {
  if (parent.querySelector(`[data-trans-id="${blockId}"]`)) return null;

  if (window.getComputedStyle(parent).position === 'static') {
    parent.style.position = 'relative';
  }

  const anchor = document.createElement('div');
  anchor.style.cssText = ANCHOR_STYLE;
  parent.appendChild(anchor);
  return anchor;
};

export const processBlocks = (blocks: Block[]): void => {
  for (const block of blocks) {
    const anchor = makeAnchor(block.containerEl, block.blockId);
    if (!anchor) continue;
    mountButton(anchor, block.contentEl, block.blockId, block.blockType, block.getContextBlocks);
  }
};
