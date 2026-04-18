// inject.tsx — Shadow DOM mounting and block injection into GitHub issue pages

import { createRoot } from 'react-dom/client';
import { githubIssueQueries as q } from '../constants/github-query';
import shadowStyles from './shadow.css?inline';
import { TranslateButton } from './components/TranslateButton';
import { getSettings } from './settings';

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

  let originalHTML = '';

  createRoot(mount).render(
    <TranslateButton
      getSettings={getSettings}
      getText={() => contentEl.innerText}
      onTranslate={(translated) => {
        originalHTML = contentEl.innerHTML;
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'white-space: pre-wrap; line-height: 1.6; font-family: inherit;';
        wrapper.textContent = translated;
        contentEl.innerHTML = '';
        contentEl.appendChild(wrapper);
      }}
      onRestore={() => {
        contentEl.innerHTML = originalHTML;
      }}
    />
  );

  anchor.appendChild(host);
};

const injectIntoTitle = (): void => {
  const container = document.querySelector<HTMLElement>(q.titleContainer);
  if (!container) return;

  const textEl = container.querySelector<HTMLElement>(q.titleText);
  if (!textEl) return;

  if (window.getComputedStyle(container).position === 'static') {
    container.style.position = 'relative';
  }

  const anchor = document.createElement('div');
  anchor.style.cssText = 'position:absolute;top:4px;right:0;z-index:100;';
  container.appendChild(anchor);

  mountButton(anchor, textEl, 'issue-title');
};

const injectIntoIssueBody = (): void => {
  const block = document.querySelector<HTMLElement>(q.issueBody);
  if (!block) return;

  const contentEl = block.querySelector<HTMLElement>(`${q.issueBodyViewer} ${q.markdownBody}`);
  if (!contentEl) return;

  if (window.getComputedStyle(block).position === 'static') {
    block.style.position = 'relative';
  }

  const anchor = document.createElement('div');
  anchor.style.cssText = 'position:absolute;top:8px;right:8px;z-index:100;';
  block.appendChild(anchor);

  mountButton(anchor, contentEl, 'issue-body');
};

const injectIntoComment = (block: Element, index: number): void => {
  const contentEl = block.querySelector<HTMLElement>(q.markdownBody);
  if (!contentEl) return;

  const actionsEl = block.querySelector<HTMLElement>(q.commentHeaderActions);
  if (!actionsEl) return;

  mountButton(actionsEl, contentEl, `comment-${index}`);
};

export const processBlocks = (): void => {
  injectIntoTitle();
  injectIntoIssueBody();
  document.querySelectorAll(q.commentBlock).forEach((block, i) => injectIntoComment(block, i));
};
