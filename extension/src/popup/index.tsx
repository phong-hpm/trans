// index.tsx — Popup entry point

import './popup.css';

import { createRoot } from 'react-dom/client';

import { useGlobalStore } from '../store/global';
import { Popup } from './Popup';

useGlobalStore.getState().init();

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<Popup />);
}
