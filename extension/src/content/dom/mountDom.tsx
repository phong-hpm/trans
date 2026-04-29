// dom/mountDom.tsx — Mount global UI components (modal, sidebar, toaster) into document.body

import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';

import { ControlPanelModal } from '../components/ControlPanelModal';
import { Sidebar } from '../components/Sidebar';
import { TranslateAllButton } from '../components/TranslateAllButton';
import { createShadowHost } from './shadowDom';

/**
 * Shared helper: creates a shadow DOM host, appends it to body, and mounts a React component.
 */
const mountShadowDom = (dataAttr: string, hostStyle: string, Component: React.FC): void => {
  if (document.querySelector(`[${dataAttr}]`)) return;

  const { host, mount } = createShadowHost(hostStyle);
  host.setAttribute(dataAttr, 'true');

  document.body.appendChild(host);
  createRoot(mount).render(<Component />);
};

/**
 * Mounts the ControlPanelModal into document.body via shadow DOM. Idempotent.
 */
export const mountModalDom = (): void =>
  mountShadowDom(
    'data-trans-modal',
    'position:fixed;top:0;left:0;width:100%;height:0;z-index:999999;',
    ControlPanelModal
  );

/**
 * Mounts the Sidebar into document.body via shadow DOM. Idempotent.
 */
export const mountSidebarDom = (): void =>
  mountShadowDom(
    'data-trans-sidebar',
    'position:absolute;top:0;left:0;width:0;height:0;z-index:999998;pointer-events:none;',
    Sidebar
  );

/**
 * Mounts the Translate All button next to the page header anchor. Idempotent.
 * anchor — the element to append the button host into.
 * getBlockCount — called at click time to know how many blocks exist.
 */
export const mountTranslateAllDom = (anchor: HTMLElement, getBlockCount: () => number): void => {
  if (anchor.querySelector('[data-trans-translate-all]')) return;

  const { host, mount } = createShadowHost('display:inline-flex;align-items:center;');
  host.setAttribute('data-trans-translate-all', 'true');

  anchor.appendChild(host);
  createRoot(mount).render(<TranslateAllButton getBlockCount={getBlockCount} />);
};

/**
 * Mounts the Sonner Toaster into document.body. Idempotent.
 */
export const mountToasterDom = (): void => {
  if (document.querySelector('[data-trans-toaster]')) return;

  const el = document.createElement('div');
  el.setAttribute('data-trans-toaster', '');
  document.body.appendChild(el);
  createRoot(el).render(<Toaster position="bottom-right" richColors />);
};
