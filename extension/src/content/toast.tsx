// toast.tsx — Mounts the Sonner Toaster into the main document body

import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';

export const mountToaster = (): void => {
  if (document.querySelector('[data-trans-toaster]')) return;

  const el = document.createElement('div');
  el.setAttribute('data-trans-toaster', '');
  document.body.appendChild(el);
  createRoot(el).render(<Toaster position="bottom-right" richColors />);
};
