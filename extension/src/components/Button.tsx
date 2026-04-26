// Button.tsx — Reusable button with contain/outline variants and primary/danger/ghost colors; also exports ConfirmButton

import clsx from 'clsx';
import type React from 'react';
import { useState } from 'react';

type Variant = 'contain' | 'outline';
type Color = 'primary' | 'danger' | 'ghost';
type Size = 'sm' | 'md';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  color?: Color;
  size?: Size;
  fullWidth?: boolean;
}

export const Button: React.FC<Props> = ({
  variant = 'contain',
  color = 'primary',
  size = 'sm',
  fullWidth = false,
  className,
  children,
  ...rest
}) => {
  return (
    <button
      type="button"
      className={clsx(
        'flex items-center gap-1 font-medium rounded transition-colors disabled:opacity-60',
        size === 'sm' && 'py-1 px-2 text-xs',
        size === 'md' && 'py-1.5 px-3 text-xs',
        fullWidth && 'w-full',
        variant === 'contain' &&
          color === 'primary' && [
            'text-white',
            'bg-blue-600 hover:bg-blue-700 active:bg-blue-800',
            'dark:bg-blue-600 dark:hover:bg-blue-700',
          ],
        variant === 'contain' &&
          color === 'danger' && [
            'text-white',
            'bg-red-500 hover:bg-red-600 active:bg-red-700',
            'dark:bg-red-500 dark:hover:bg-red-600',
          ],
        variant === 'contain' &&
          color === 'ghost' && [
            'text-gray-700 bg-gray-100 hover:bg-gray-200',
            'dark:text-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700',
          ],
        variant === 'outline' &&
          color === 'primary' && [
            'border border-blue-500 text-blue-600 hover:bg-blue-50',
            'dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20',
          ],
        variant === 'outline' &&
          color === 'danger' && [
            'border border-red-400 text-red-600 hover:bg-red-50',
            'dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/20',
          ],
        variant === 'outline' &&
          color === 'ghost' && [
            'border',
            'border-gray-200 text-gray-600 hover:bg-gray-50',
            'dark:border-gray-600 dark:bg-gray-950 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200',
          ],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
};

interface ConfirmButtonProps extends Omit<
  React.ComponentPropsWithoutRef<typeof Button>,
  'onClick'
> {
  onConfirm: () => void;
  confirmMessage?: string;
}

export const ConfirmButton: React.FC<ConfirmButtonProps> = ({
  onConfirm,
  confirmMessage,
  children,
  ...rest
}) => {
  const [pending, setPending] = useState(false);

  if (pending) {
    return (
      <div className="space-y-1.5">
        {confirmMessage && (
          <p className="text-xs text-amber-600 dark:text-amber-400">{confirmMessage}</p>
        )}
        <div className="flex gap-2">
          <Button
            variant="outline"
            color="ghost"
            className="flex-1"
            onClick={() => setPending(false)}
          >
            Cancel
          </Button>
          <Button
            variant="contain"
            color="danger"
            className="flex-1"
            onClick={() => {
              onConfirm();
              setPending(false);
            }}
          >
            Confirm
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button onClick={() => setPending(true)} {...rest}>
      {children}
    </Button>
  );
};
