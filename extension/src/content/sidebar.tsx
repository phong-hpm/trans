// sidebar.tsx — Mounts the global Sidebar into document.body via shadow DOM

import React from 'react';
import { createRoot } from 'react-dom/client';
import { Sidebar } from './components/Sidebar';
import shadowStyles from './shadow.css?inline';

export const mountSidebar = (): void => {
  if (document.querySelector('[data-trans-sidebar]')) return;

  const host = document.createElement('div');
  host.setAttribute('data-trans-sidebar', 'true');
  host.style.cssText = 'position:absolute;top:0;left:0;width:0;height:0;z-index:999998;pointer-events:none;';

  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = shadowStyles;
  shadow.appendChild(style);

  const mount = document.createElement('div');
  shadow.appendChild(mount);

  document.body.appendChild(host);
  createRoot(mount).render(<Sidebar />);
};
