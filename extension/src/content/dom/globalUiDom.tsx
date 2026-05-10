// dom/globalUiDom.tsx — Mount global shadow-root UI islands owned by App

import { createRoot } from 'react-dom/client';

import { ROOT_NODE_ID } from '../../constants/dom';
import type { Block } from '../../platforms/types';
import { Sidebar } from '../components/Sidebar';
import { TranslateAllButton } from '../components/TranslateAllButton';
import { createShadowHost } from './shadowDom';

export const mountGlobalUiDom = (getBlocks: () => Block[]): void => {
  if (document.getElementById(ROOT_NODE_ID)) return;

  const { host, mount } = createShadowHost(
    'position:absolute;top:0;left:0;width:0;height:0;z-index:999998;pointer-events:none;'
  );
  host.id = ROOT_NODE_ID;

  document.body.appendChild(host);
  createRoot(mount).render(
    <>
      <Sidebar />
      <TranslateAllButton getBlocks={getBlocks} />
    </>
  );
};
