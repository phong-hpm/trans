// Button.tsx — Reusable button with primary, danger, and ghost variants

import clsx from 'clsx';
import type React from 'react';

type Variant = 'primary' | 'danger' | 'ghost';
type Size = 'sm' | 'md';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

export const Button: React.FC<Props> = ({
  variant = 'primary',
  size = 'sm',
  fullWidth = false,
  className,
  children,
  ...rest
}) => {
  return (
    <button
      type='button'
      className={clsx(
        'font-medium rounded transition-colors disabled:opacity-60',
        size === 'sm' && 'py-1 px-2 text-xs',
        size === 'md' && 'py-1.5 px-3 text-xs',
        fullWidth && 'w-full',
        variant === 'primary' && [
          'text-white',
          'bg-blue-600 hover:bg-blue-700 active:bg-blue-800',
          'dark:bg-blue-600 dark:hover:bg-blue-700',
        ],
        variant === 'danger' && [
          'text-white',
          'bg-red-500 hover:bg-red-600 active:bg-red-700',
          'dark:bg-red-500 dark:hover:bg-red-600',
        ],
        variant === 'ghost' && [
          'border',
          'border-gray-200 text-gray-600 hover:bg-gray-50',
          'dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800',
        ],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
};
