// content-script.tsx — Entry point: initialises injection and watches for DOM changes

import { githubIssueQueries as q } from '../constants/github-query';
import { processBlocks } from './inject';
import { mountToaster } from './toast';

const init = (): void => {
  mountToaster();
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
