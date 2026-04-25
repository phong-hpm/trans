// index.tsx — Popup entry point

import { createRoot } from 'react-dom/client';
import { useGlobalStore } from '../store/global';
import { Popup } from './Popup';
import './popup.css';

useGlobalStore.getState().init();

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<Popup />);
}
