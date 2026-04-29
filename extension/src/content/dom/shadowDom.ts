// dom/shadowDom.ts — Shared factory for shadow DOM hosts with Tailwind styles injected

import shadowStyles from '../shadow.css?inline';

/**
 * Creates a shadow root host element with Tailwind CSS injected.
 * Returns the host (not yet attached to the document) and the mount point inside the shadow root.
 * Caller is responsible for appending host to the DOM and for cleanup.
 */
export const createShadowHost = (style: string): { host: HTMLElement; mount: HTMLElement } => {
  const host = document.createElement('div');
  host.style.cssText = style;

  const shadow = host.attachShadow({ mode: 'open' });

  const styleEl = document.createElement('style');
  styleEl.textContent = shadowStyles;
  shadow.appendChild(styleEl);

  const mount = document.createElement('div');
  shadow.appendChild(mount);

  return { host, mount };
};
