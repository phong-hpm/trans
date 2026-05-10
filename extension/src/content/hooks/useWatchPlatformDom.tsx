// useWatchPlatformDom.ts — Watches platform DOM changes and mounts per-block translation toolbars

import { useCallback, useEffect, useState } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';

import { BLOCK_HOST_DATASET_KEY, BLOCK_HOST_SELECTOR } from '../../constants/dom';
import { detectPlatform } from '../../platforms';
import type { Block, BlockDomAccess, BlockTranslationTarget } from '../../platforms/types';
import { TranslateToolbar } from '../components/TranslateToolbar';
import { createShadowHost } from '../dom/shadowDom';
import { getParsedContentsDom } from '../dom/textDom';

interface UseWatchPlatformDomResult {
  href: string;
  platformName: string | null;
  getBlocks: () => Block[];
}

const blockRoots = new Map<HTMLElement, Root>();

const cleanupOrphanedRoots = (): void => {
  for (const [anchor, root] of blockRoots) {
    if (!anchor.isConnected) {
      root.unmount();
      blockRoots.delete(anchor);
    }
  }
};

const mountBlockToolbar = ({
  anchor,
  block,
  parsedContent,
}: {
  anchor: HTMLElement;
  block: Block;
  parsedContent: string;
}): void => {
  if (anchor.querySelector(BLOCK_HOST_SELECTOR)) return;

  const { host, mount } = createShadowHost('');
  host.dataset[BLOCK_HOST_DATASET_KEY] = parsedContent.slice(0, 40);

  // Build normalized DOM access — all platform-specific querying stays here
  const domAccess: BlockDomAccess = {
    getElement: () => block.getLiveElement?.() ?? block.contentEl,
    getElements: () => {
      const primary = domAccess.getElement();
      const attached = block.getLiveAttachedElements?.() ?? block.attachedContentEls ?? [];
      return [...attached, primary].filter((el, index, elements) => elements.indexOf(el) === index);
    },
    getContextBlocks: block.getContextBlocks,
    getContainerEl: () => block.containerEl,
  };

  const blockTarget: BlockTranslationTarget = {
    parsedContent,
    blockType: block.blockType,
    domAccess,
  };

  const root = createRoot(mount);
  root.render(<TranslateToolbar blockTarget={blockTarget} />);
  blockRoots.set(anchor, root);
  anchor.appendChild(host);
};

const createBlockAnchor = (contentEl: HTMLElement): HTMLElement | null => {
  const contentParent = contentEl.parentElement;
  if (!contentParent) return null;
  if (contentParent.querySelector(BLOCK_HOST_SELECTOR)) return null;

  const anchor = document.createElement('div');
  contentParent.prepend(anchor);
  return anchor;
};

const processBlocks = (blocks: Block[]): void => {
  cleanupOrphanedRoots();

  for (const block of blocks) {
    const anchor = createBlockAnchor(block.contentEl);
    if (!anchor) continue;

    const parsedContent = getParsedContentsDom([
      ...(block.attachedContentEls ?? []),
      block.contentEl,
    ]);
    if (!parsedContent) continue;

    mountBlockToolbar({ anchor, block, parsedContent });
  }
};

const observePage = (onMutation: () => void): (() => void) => {
  let debounce: ReturnType<typeof setTimeout>;

  const observer = new MutationObserver(() => {
    clearTimeout(debounce);
    debounce = setTimeout(onMutation, 200);
  });

  observer.observe(document.body, { childList: true, subtree: true });
  return () => {
    clearTimeout(debounce);
    observer.disconnect();
  };
};

export const useWatchPlatformDom = (): UseWatchPlatformDomResult => {
  const [href, setHref] = useState(location.href);
  const [platformName, setPlatformName] = useState<string | null>(
    () => detectPlatform(location.href)?.name ?? null
  );

  const getBlocks = useCallback(() => detectPlatform(location.href)?.getBlocks() ?? [], []);

  const syncPlatformDom = useCallback(() => {
    const platform = detectPlatform(location.href);
    const nextHref = location.href;
    const nextPlatformName = platform?.name ?? null;

    setHref((prev) => (prev === nextHref ? prev : nextHref));
    setPlatformName((prev) => (prev === nextPlatformName ? prev : nextPlatformName));

    processBlocks(platform?.getBlocks() ?? []);
  }, []);

  useEffect(() => {
    syncPlatformDom();
    return observePage(syncPlatformDom);
  }, [syncPlatformDom]);

  return { href, platformName, getBlocks };
};
