// dom/injectDom.tsx — Shadow DOM injection engine: mounts translate UI onto platform blocks

import { createRoot } from 'react-dom/client';

import { BlockTypeEnum } from '../../enums';
import type { Block } from '../../platforms/types';
import type { ContextBlock } from '../../types';
import { TranslateButton } from '../components/TranslateButton';
import { TranslateToolbar } from '../components/TranslateToolbar';
import shadowStyles from '../shadow.css?inline';

// Title button floats outside the container to the right
const TITLE_ANCHOR_STYLE = 'position:absolute;top:8px;right:-32px;z-index:9999;';

/**
 * Extracts and joins all visible text nodes from an element, separated by newlines.
 * Used as parsedContent — the stable content-based identity for a block.
 */
export const getParsedContentDom = (el: HTMLElement): string => {
  const parts: string[] = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const text = node.textContent?.trim();
    if (text) parts.push(text);
  }
  return parts.join('\n');
};

/**
 * Creates a shadow root host with Tailwind styles and mounts the translate UI into it.
 */
const mountShadowDom = (
  anchor: HTMLElement,
  contentEl: HTMLElement,
  parsedContent: string,
  blockType: BlockTypeEnum,
  getLiveElement: (() => HTMLElement | null) | undefined,
  getContextBlocks?: () => ContextBlock[]
): void => {
  if (anchor.querySelector(`[data-trans-block]`)) return;

  const host = document.createElement('div');
  host.setAttribute('data-trans-block', parsedContent.slice(0, 40));

  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = shadowStyles;
  shadow.appendChild(style);

  const mount = document.createElement('div');
  shadow.appendChild(mount);

  // Prefer getLiveElement (re-queries DOM each call) over captured contentEl reference,
  // so getElement() never returns a stale node after GitHub re-renders the block.
  const getElement = (): HTMLElement => getLiveElement?.() ?? contentEl;

  const props = { parsedContent, blockType, getElement, getContextBlocks };
  const ui =
    blockType === BlockTypeEnum.Title ? (
      <TranslateButton {...props} />
    ) : (
      <TranslateToolbar {...props} />
    );

  createRoot(mount).render(ui);
  anchor.appendChild(host);
};

/**
 * Creates an absolutely-positioned anchor for the title block's circle button.
 * Returns null if the anchor already exists.
 */
const createTitleAnchorDom = (containerEl: HTMLElement): HTMLElement | null => {
  if (containerEl.querySelector(`[data-trans-block]`)) return null;

  if (window.getComputedStyle(containerEl).position === 'static') {
    containerEl.style.position = 'relative';
  }

  const anchor = document.createElement('div');
  anchor.style.cssText = TITLE_ANCHOR_STYLE;
  containerEl.appendChild(anchor);
  return anchor;
};

/**
 * Creates a flow anchor prepended above the content element (toolbar sits above content).
 * Returns null if the anchor already exists.
 */
const createBlockAnchorDom = (contentEl: HTMLElement): HTMLElement | null => {
  const contentParent = contentEl.parentElement;
  if (!contentParent) return null;
  if (contentParent.querySelector(`[data-trans-block]`)) return null;

  const anchor = document.createElement('div');
  contentParent.prepend(anchor);
  return anchor;
};

/**
 * Processes a list of blocks: creates anchors and mounts shadow UI for any new blocks.
 */
export const processBlocksDom = (blocks: Block[]): void => {
  for (const block of blocks) {
    const anchor =
      block.blockType === BlockTypeEnum.Title
        ? createTitleAnchorDom(block.containerEl)
        : createBlockAnchorDom(block.contentEl);

    if (!anchor) continue;

    const parsedContent = getParsedContentDom(block.contentEl);
    if (!parsedContent) continue;

    mountShadowDom(
      anchor,
      block.contentEl,
      parsedContent,
      block.blockType,
      block.getLiveElement,
      block.getContextBlocks
    );
  }
};
