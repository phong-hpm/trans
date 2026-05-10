// main.tsx — Content-script runtime: detects supported pages and mounts React islands

import { detectPlatform } from '../platforms';
import { processBlocksDom } from './dom/injectDom';
import { mountRuntimeDom } from './dom/mountDom';
import { observePageDom } from './dom/observerDom';

const getCurrentPlatform = () => detectPlatform(location.href);

const mountPlatformDom = (): void => {
  mountRuntimeDom({
    href: location.href,
    platformName: getCurrentPlatform()?.name ?? null,
    getBlocks: () => getCurrentPlatform()?.getBlocks() ?? [],
  });
};

const renderPlatformBlocks = (): void => {
  const platform = getCurrentPlatform();
  if (!platform) return;

  processBlocksDom(platform.getBlocks());
};

let lastUrl = location.href;

observePageDom(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    mountPlatformDom();
  }

  renderPlatformBlocks();
});

mountPlatformDom();
renderPlatformBlocks();
