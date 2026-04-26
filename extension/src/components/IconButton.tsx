// IconButton.tsx — Small square icon-only button with contain/outline variants; also exports ConfirmIconButton

import clsx from 'clsx';
import { Check, X } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';

type Variant = 'contain' | 'outline';
type Color = 'primary' | 'danger' | 'ghost';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md';
  variant?: Variant;
  color?: Color;
}

export const IconButton: React.FC<Props> = ({
  size = 'sm',
  variant = 'contain',
  color = 'ghost',
  className,
  children,
  ...rest
}) => (
  <button
    type="button"
    className={clsx(
      'flex items-center justify-center gap-1 rounded transition-colors',
      size === 'sm' && 'w-6 h-6',
      size === 'md' && 'w-8 h-8',
      variant === 'contain' &&
        color === 'primary' && [
          'text-white bg-blue-600 hover:bg-blue-700',
          'dark:bg-blue-600 dark:hover:bg-blue-700',
        ],
      variant === 'contain' &&
        color === 'danger' && [
          'text-white bg-red-500 hover:bg-red-600',
          'dark:bg-red-500 dark:hover:bg-red-600',
        ],
      variant === 'contain' &&
        color === 'ghost' && [
          'text-gray-400 hover:text-gray-700 hover:bg-gray-100',
          'dark:text-gray-500 dark:hover:text-gray-200 dark:hover:bg-gray-800',
        ],
      variant === 'outline' &&
        color === 'primary' && [
          'border border-blue-500 text-blue-600 hover:bg-blue-50',
          'dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20',
        ],
      variant === 'outline' &&
        color === 'danger' && [
          'border border-red-400 text-red-500 hover:bg-red-50',
          'dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/20',
        ],
      variant === 'outline' &&
        color === 'ghost' && [
          'border',
          'border-gray-200 bg-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700',
          'dark:border-gray-600 dark:bg-transparent dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200',
        ],
      className
    )}
    {...rest}
  >
    {children}
  </button>
);

interface ConfirmIconButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'onClick'
> {
  onConfirm: () => void;
  size?: 'sm' | 'md';
  variant?: Variant;
  color?: Color;
}

export const ConfirmIconButton: React.FC<ConfirmIconButtonProps> = ({
  onConfirm,
  children,
  ...rest
}) => {
  const [pending, setPending] = useState(false);

  if (pending) {
    return (
      <div className="flex items-center gap-1">
        <IconButton onClick={() => setPending(false)} title="Cancel">
          <X className="w-3 h-3" />
        </IconButton>
        <IconButton
          onClick={() => {
            onConfirm();
            setPending(false);
          }}
          title="Confirm delete"
          color="danger"
        >
          <Check className="w-3 h-3" />
        </IconButton>
      </div>
    );
  }

  return (
    <IconButton onClick={() => setPending(true)} {...rest}>
      {children}
    </IconButton>
  );
};
