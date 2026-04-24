// inject.tsx — Shadow DOM mounting and block injection into GitHub issue pages

import { createRoot } from 'react-dom/client';
import { githubIssueQueries as q } from '../constants/github-query';
import type { BlockType, ContextBlock } from '../types';
import { TranslateButton } from './components/TranslateButton';
import { extractSegments } from './domSegments';
import { getSettings } from './settings';
import shadowStyles from './shadow.css?inline';

const ANCHOR_STYLE = 'position:absolute;top:8px;right:-32px;z-index:9999;';

const getSegmentText = (el: HTMLElement): string => {
  const spans = el.querySelectorAll<HTMLElement>('[data-trans-id]');
  if (spans.length) {
    // Element has been processed — read original text from data-original (pre-translation)
    return Array.from(spans)
      .map((s) => s.getAttribute('data-original') ?? s.textContent ?? '')
      .join(' ');
  }
  return extractSegments(el)
    .map((s) => s.text)
    .join(' ');
};

const mountButton = (
  anchor: HTMLElement,
  contentEl: HTMLElement,
  blockId: string,
  blockType: BlockType,
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

  createRoot(mount).render(
    <TranslateButton
      blockId={blockId}
      blockType={blockType}
      getSettings={getSettings}
      getElement={() => contentEl}
      getContextBlocks={getContextBlocks}
    />
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

const getTitleEl = (): HTMLElement | null => document.querySelector<HTMLElement>(q.titleText);

const getTaskEl = (): HTMLElement | null =>
  document.querySelector<HTMLElement>(`${q.issueBodyViewer} ${q.markdownBody}`);

const injectIntoTitle = (): void => {
  const container = document.querySelector<HTMLElement>(q.titleContainer);
  if (!container) return;

  const textEl = container.querySelector<HTMLElement>(q.titleText);
  if (!textEl) return;

  const anchor = makeAnchor(container, 'issue-title');
  if (!anchor) return;

  mountButton(anchor, textEl, 'issue-title', 'title');
};

const injectIntoIssueBody = (): void => {
  const block = document.querySelector<HTMLElement>(q.issueBody);
  if (!block) return;

  const contentEl = block.querySelector<HTMLElement>(`${q.issueBodyViewer} ${q.markdownBody}`);
  if (!contentEl) return;

  const anchor = makeAnchor(block, 'issue-body');
  if (!anchor) return;

  // Include title as context so the LLM has full task understanding
  const getContextBlocks = (): ContextBlock[] => {
    const titleEl = getTitleEl();
    if (!titleEl) return [];
    return [{ type: 'title', text: getSegmentText(titleEl) }];
  };

  mountButton(anchor, contentEl, 'issue-body', 'task', getContextBlocks);
};

const injectIntoComment = (block: Element, index: number, allCommentBlocks: Element[]): void => {
  const contentEl = block.querySelector<HTMLElement>(q.markdownBody);
  if (!contentEl) return;

  const blockId = `comment-${index}`;
  const anchor = makeAnchor(block as HTMLElement, blockId);
  if (!anchor) return;

  const getContextBlocks = (): ContextBlock[] => {
    const blocks: ContextBlock[] = [];

    const titleEl = getTitleEl();
    if (titleEl) blocks.push({ type: 'title', text: getSegmentText(titleEl) });

    const taskEl = getTaskEl();
    if (taskEl) blocks.push({ type: 'task', text: getSegmentText(taskEl) });

    // All previous comments as context
    allCommentBlocks.slice(0, index).forEach((b) => {
      const el = b.querySelector<HTMLElement>(q.markdownBody);
      if (el) blocks.push({ type: 'comment', text: getSegmentText(el) });
    });

    return blocks;
  };

  mountButton(anchor, contentEl, blockId, 'comment', getContextBlocks);
};

export const processBlocks = (): void => {
  injectIntoTitle();
  injectIntoIssueBody();

  const commentBlocks = Array.from(document.querySelectorAll(q.commentBlock));
  commentBlocks.forEach((block, i) => injectIntoComment(block, i, commentBlocks));
};
