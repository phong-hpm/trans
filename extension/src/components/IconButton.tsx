// IconButton.tsx — Small square icon-only button with hover state

import clsx from 'clsx';
import type React from 'react';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md';
}

export const IconButton: React.FC<Props> = ({ size = 'sm', className, children, ...rest }) => (
  <button
    type='button'
    className={clsx(
      'flex items-center justify-center rounded transition-colors',
      size === 'sm' && 'w-6 h-6',
      size === 'md' && 'w-8 h-8',
      'text-gray-400 hover:text-gray-700 hover:bg-gray-100',
      'dark:text-gray-500 dark:hover:text-gray-200 dark:hover:bg-gray-800',
      className,
    )}
    {...rest}
  >
    {children}
  </button>
);
