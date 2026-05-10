// dom/injectDom.tsx — Shadow DOM injection engine: mounts translate UI onto platform blocks

import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';

import type { Block } from '../../platforms/types';
import type { ContextBlock } from '../../types';
import { TranslateToolbar } from '../components/TranslateToolbar';
import { createShadowHost } from './shadowDom';

/**
 * Tracks mounted React roots keyed by their anchor element (a unique DOM node per block).
 * Using the anchor as key avoids collision when two blocks share identical parsedContent.
 */
const blockRoots = new Map<HTMLElement, Root>();

/**
 * Unmounts and removes any roots whose anchor element is no longer in the document.
 * Called at the start of each processBlocksDom run.
 */
const cleanupOrphanedRoots = (): void => {
  for (const [anchor, root] of blockRoots) {
    if (!anchor.isConnected) {
      root.unmount();
      blockRoots.delete(anchor);
    }
  }
};

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

export const getParsedContentsDom = (elements: HTMLElement[]): string =>
  elements
    .map((el) => getParsedContentDom(el))
    .filter(Boolean)
    .join('\n');

/**
 * Creates a shadow root host with Tailwind styles and mounts the translate UI into it.
 * containerEl is the stable outer ancestor (e.g. .react-issue-comment) used by
 * observeBlockDom — it must not be replaced by framework re-renders.
 */
const mountShadowDom = (
  anchor: HTMLElement,
  contentEl: HTMLElement,
  attachedContentEls: HTMLElement[],
  parsedContent: string,
  blockType: Block['blockType'],
  getLiveElement: (() => HTMLElement | null) | undefined,
  getLiveAttachedElements: (() => HTMLElement[]) | undefined,
  getContextBlocks: (() => ContextBlock[]) | undefined,
  containerEl: HTMLElement
): void => {
  if (anchor.querySelector(`[data-trans-block]`)) return;

  const { host, mount } = createShadowHost('');
  host.setAttribute('data-trans-block', parsedContent.slice(0, 40));

  // Prefer getLiveElement (re-queries DOM each call) over captured contentEl reference,
  // so getElement() never returns a stale node after GitHub re-renders the block.
  const getElement = (): HTMLElement => getLiveElement?.() ?? contentEl;
  const getElements = (): HTMLElement[] => {
    const primary = getElement();
    const attached = getLiveAttachedElements?.() ?? attachedContentEls;
    return [...attached, primary].filter((el, index, elements) => elements.indexOf(el) === index);
  };
  const getContainerEl = (): HTMLElement => containerEl;

  const props = {
    parsedContent,
    blockType,
    getElement,
    getElements,
    getContextBlocks,
    getContainerEl,
  };
  const ui = <TranslateToolbar {...props} />;

  const root = createRoot(mount);
  root.render(ui);
  blockRoots.set(anchor, root);
  anchor.appendChild(host);
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
 * Cleans up orphaned React roots from previously detached blocks before mounting.
 */
export const processBlocksDom = (blocks: Block[]): void => {
  cleanupOrphanedRoots();

  for (const block of blocks) {
    const anchor = createBlockAnchorDom(block.contentEl);

    if (!anchor) continue;

    const parsedContent = getParsedContentsDom([
      ...(block.attachedContentEls ?? []),
      block.contentEl,
    ]);
    if (!parsedContent) continue;

    mountShadowDom(
      anchor,
      block.contentEl,
      block.attachedContentEls ?? [],
      parsedContent,
      block.blockType,
      block.getLiveElement,
      block.getLiveAttachedElements,
      block.getContextBlocks,
      block.containerEl
    );
  }
};
