// main.tsx — Content-script entrypoint: boots the React runtime island

import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';

import { RUNTIME_NODE_ID } from '../constants/dom';
import { App } from './components/App';

let runtimeRoot: Root | null = null;

const mountRuntimeDom = (): void => {
  if (!runtimeRoot) {
    const el = document.createElement('div');
    el.id = RUNTIME_NODE_ID;
    document.body.appendChild(el);
    runtimeRoot = createRoot(el);
  }

  runtimeRoot.render(<App />);
};

mountRuntimeDom();
