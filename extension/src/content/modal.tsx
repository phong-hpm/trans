// modal.tsx — Mounts the ControlPanelModal into document.body via shadow DOM

import { createRoot } from 'react-dom/client';

import { ControlPanelModal } from './components/ControlPanelModal';
import shadowStyles from './shadow.css?inline';

export const mountModal = (): void => {
  if (document.querySelector('[data-trans-modal]')) return;

  const host = document.createElement('div');
  host.setAttribute('data-trans-modal', 'true');
  host.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:0;z-index:999999;';

  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = shadowStyles;
  shadow.appendChild(style);

  const mount = document.createElement('div');
  shadow.appendChild(mount);

  document.body.appendChild(host);
  createRoot(mount).render(<ControlPanelModal />);
};
