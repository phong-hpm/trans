// Sidebar/TabContent.tsx — Shared sidebar tab content surface with consistent padding and background

import clsx from 'clsx';
import type React from 'react';

interface Props {
  padded?: boolean;
  children: React.ReactNode;
}

export const TabContent: React.FC<Props> = ({ padded = true, children }) => (
  <div className={clsx('flex-grow min-h-full h-full bg-white dark:bg-gray-950', padded && 'p-4')}>
    {children}
  </div>
);
