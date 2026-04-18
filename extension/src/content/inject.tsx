// inject.tsx — Shadow DOM mounting and block injection into GitHub issue pages

import { createRoot } from 'react-dom/client';
import { githubIssueQueries as q } from '../constants/github-query';
import { TranslateButton } from './components/TranslateButton';
import { getSettings } from './settings';
import shadowStyles from './shadow.css?inline';

const ANCHOR_STYLE = 'position:absolute;top:8px;right:-30px;z-index:9999;';

const mountButton = (anchor: HTMLElement, contentEl: HTMLElement, blockId: string): void => {
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
      getSettings={getSettings}
      getElement={() => contentEl}
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

const injectIntoTitle = (): void => {
  const container = document.querySelector<HTMLElement>(q.titleContainer);
  if (!container) return;

  const textEl = container.querySelector<HTMLElement>(q.titleText);
  if (!textEl) return;

  const anchor = makeAnchor(container, 'issue-title');
  if (!anchor) return;

  mountButton(anchor, textEl, 'issue-title');
};

const injectIntoIssueBody = (): void => {
  const block = document.querySelector<HTMLElement>(q.issueBody);
  if (!block) return;

  const contentEl = block.querySelector<HTMLElement>(`${q.issueBodyViewer} ${q.markdownBody}`);
  if (!contentEl) return;

  const anchor = makeAnchor(block, 'issue-body');
  if (!anchor) return;

  mountButton(anchor, contentEl, 'issue-body');
};

const injectIntoComment = (block: Element, index: number): void => {
  const contentEl = block.querySelector<HTMLElement>(q.markdownBody);
  if (!contentEl) return;

  const blockId = `comment-${index}`;
  const anchor = makeAnchor(block as HTMLElement, blockId);
  if (!anchor) return;

  mountButton(anchor, contentEl, blockId);
};

export const processBlocks = (): void => {
  injectIntoTitle();
  injectIntoIssueBody();
  document.querySelectorAll(q.commentBlock).forEach((block, i) => injectIntoComment(block, i));
};
