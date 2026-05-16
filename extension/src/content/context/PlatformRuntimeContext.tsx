// context/PlatformRuntimeContext.tsx — Platform DOM runtime state and block toolbar mounting

import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

import {
  ROOT_NODE_ID,
  SHADOW_APP_HOST_STYLE,
  SHADOW_APP_ROOT_DATASET_KEY,
  SHADOW_APP_ROOT_SELECTOR,
} from '../../constants/dom';
import { getPlatformAdapter } from '../../platforms';
import type { PlatformAdapter } from '../../platforms/types';
import { createShadowHost } from '../dom/shadowDom';
import { PlatformBlockToolbarRenderer } from '../renderer/PlatformBlockToolbarRenderer';

interface PlatformRuntimeValue {
  href: string;
  platformAdapter: PlatformAdapter | null;
  shadowAppRootElement: HTMLElement | null;
}

const PlatformRuntimeContext = createContext<PlatformRuntimeValue | null>(null);

const initShadowAppRootElement = (): HTMLElement | null => {
  const existingHost = document.getElementById(ROOT_NODE_ID);
  if (existingHost?.shadowRoot) {
    return existingHost.shadowRoot.querySelector<HTMLElement>(SHADOW_APP_ROOT_SELECTOR);
  }

  const { host, mount } = createShadowHost(SHADOW_APP_HOST_STYLE);
  host.id = ROOT_NODE_ID;
  mount.dataset[SHADOW_APP_ROOT_DATASET_KEY] = 'true';
  document.body.appendChild(host);

  return mount;
};

interface PlatformRuntimeProviderProps {
  children: React.ReactNode;
}

export const PlatformRuntimeProvider: React.FC<PlatformRuntimeProviderProps> = ({ children }) => {
  const [shadowAppRootElement] = useState(initShadowAppRootElement);

  const [href, setHref] = useState(location.href);
  const [platformAdapter, setPlatformAdapter] = useState<PlatformAdapter | null>(() =>
    getPlatformAdapter(location.href)
  );

  const [toolbarRenderer] = useState(() => new PlatformBlockToolbarRenderer());

  useEffect(() => {
    const syncToolbars = (): void => {
      const nextPlatformAdapter = getPlatformAdapter(location.href);

      setHref(location.href);
      setPlatformAdapter(nextPlatformAdapter);

      toolbarRenderer.renderToolbarsForPlatformBlocks(nextPlatformAdapter?.getBlocks() ?? []);
    };

    syncToolbars();

    let debounce: ReturnType<typeof setTimeout>;
    const observer = new MutationObserver(() => {
      clearTimeout(debounce);
      debounce = setTimeout(syncToolbars, 200);
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearTimeout(debounce);
      observer.disconnect();
    };
  }, [toolbarRenderer]);

  return (
    <PlatformRuntimeContext.Provider
      value={{
        href,
        platformAdapter,
        shadowAppRootElement,
      }}
    >
      {children}
    </PlatformRuntimeContext.Provider>
  );
};

export const usePlatformRuntimeContext = (): PlatformRuntimeValue => {
  const ctx = useContext(PlatformRuntimeContext);
  if (!ctx)
    throw new Error('usePlatformRuntimeContext must be used within PlatformRuntimeProvider');
  return ctx;
};
