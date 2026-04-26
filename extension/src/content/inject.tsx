// inject.tsx — Generic Shadow DOM injection engine: mounts translate UI onto platform blocks

import { createRoot } from 'react-dom/client';

import { BlockTypeEnum } from '../enums';
import type { Block } from '../platforms/types';
import type { ContextBlock } from '../types';
import { TranslateButton } from './components/TranslateButton';
import { TranslateToolbar } from './components/TranslateToolbar';
import shadowStyles from './shadow.css?inline';

// Title: floats outside the container to the right (small circle button)
const TITLE_ANCHOR_STYLE = 'position:absolute;top:8px;right:-32px;z-index:9999;';

const mountUI = (
  anchor: HTMLElement,
  contentEl: HTMLElement,
  blockId: string,
  blockType: BlockTypeEnum,
  getLiveElement: (() => HTMLElement | null) | undefined,
  getContextBlocks?: () => ContextBlock[]
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

  // Prefer getLiveElement (re-queries DOM each call) over the captured contentEl reference,
  // so getElement() never returns a stale node after GitHub re-renders the block.
  const getElement = (): HTMLElement => getLiveElement?.() ?? contentEl;

  const props = {
    blockId,
    blockType,
    getElement,
    getContextBlocks,
  };

  // Title uses the small circle button; all other block types use the toolbar
  const ui =
    blockType === BlockTypeEnum.Title ? (
      <TranslateButton {...props} />
    ) : (
      <TranslateToolbar {...props} />
    );

  createRoot(mount).render(ui);
  anchor.appendChild(host);
};

const makeTitleAnchor = (containerEl: HTMLElement, blockId: string): HTMLElement | null => {
  if (containerEl.querySelector(`[data-trans-id="${blockId}"]`)) return null;

  if (window.getComputedStyle(containerEl).position === 'static') {
    containerEl.style.position = 'relative';
  }

  const anchor = document.createElement('div');
  anchor.style.cssText = TITLE_ANCHOR_STYLE;
  containerEl.appendChild(anchor);
  return anchor;
};

const makeBlockAnchor = (contentEl: HTMLElement, blockId: string): HTMLElement | null => {
  const contentParent = contentEl.parentElement;
  if (!contentParent) return null;
  if (contentParent.querySelector(`[data-trans-id="${blockId}"]`)) return null;

  const anchor = document.createElement('div');
  // Injected in normal flow as the first child — toolbar sits naturally above content
  contentParent.prepend(anchor);
  return anchor;
};

export const processBlocks = (blocks: Block[]): void => {
  for (const block of blocks) {
    const anchor =
      block.blockType === BlockTypeEnum.Title
        ? makeTitleAnchor(block.containerEl, block.blockId)
        : makeBlockAnchor(block.contentEl, block.blockId);

    if (!anchor) continue;
    mountUI(
      anchor,
      block.contentEl,
      block.blockId,
      block.blockType,
      block.getLiveElement,
      block.getContextBlocks
    );
  }
};
