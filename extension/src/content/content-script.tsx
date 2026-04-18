import { createRoot } from 'react-dom/client';
import { githubIssueQueries as q } from '../constants/github-query';
import { DEFAULT_SETTINGS, type ExtensionSettings } from '../types';
import shadowStyles from './shadow.css?inline';
import { TranslateButton } from './components/TranslateButton';

// --- Settings cache ---

let settingsCache: ExtensionSettings | null = null;

const getSettings = (): Promise<ExtensionSettings> => {
  if (settingsCache) return Promise.resolve(settingsCache);
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
      settingsCache = items as ExtensionSettings;
      resolve(settingsCache);
    });
  });
};

chrome.storage.onChanged.addListener(() => {
  settingsCache = null;
});

// --- Shadow DOM mount ---

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

// --- Block injection ---

const injectIntoTitle = (): void => {
  const container = document.querySelector<HTMLElement>(q.titleContainer);
  if (!container) return;

  const textEl = container.querySelector<HTMLElement>(q.titleText);
  if (!textEl) return;

  // Absolutely position the button inside the h1 container
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

  // Absolutely position the button inside the issue body block
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

  // Inject into the right-side actions area of the comment header
  const actionsEl = block.querySelector<HTMLElement>(q.commentHeaderActions);
  if (!actionsEl) return;

  mountButton(actionsEl, contentEl, `comment-${index}`);
};

// --- Main scan ---

const processBlocks = (): void => {
  injectIntoTitle();
  injectIntoIssueBody();

  document.querySelectorAll(q.commentBlock).forEach((block, i) => injectIntoComment(block, i));
};

const init = (): void => {
  processBlocks();

  let debounce: ReturnType<typeof setTimeout>;
  new MutationObserver(() => {
    clearTimeout(debounce);
    debounce = setTimeout(processBlocks, 400);
  }).observe(document.body, { childList: true, subtree: true });
};

if (location.pathname.match(q.pagePattern)) {
  init();
}
