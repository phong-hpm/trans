// Modal.tsx — Generic modal shell: backdrop + rounded card with header and body slot

import clsx from 'clsx';
import { X } from 'lucide-react';
import type React from 'react';
import { useEffect } from 'react';

import { ThemeWrapper } from './ThemeWrapper';

/** 'blur' — dim + blur overlay; 'dim' — dim only; 'none' — transparent, click-through */
export type ModalBackdrop = 'blur' | 'dim' | 'none';
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASS: Record<ModalSize, string> = {
  sm: 'w-[320px]',
  md: 'w-[480px]',
  lg: 'w-[600px]',
  xl: 'w-[760px]',
};

interface Props {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  backdrop?: ModalBackdrop;
  size?: ModalSize;
  children: React.ReactNode;
}

export const Modal: React.FC<Props> = ({
  open,
  onClose,
  title,
  backdrop = 'blur',
  size = 'sm',
  children,
}) => {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <ThemeWrapper>
      <div
        className="fixed inset-0 z-[999999] flex items-start justify-center pt-16"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        {/* Backdrop — only rendered when not 'none' */}
        {backdrop !== 'none' && (
          <div
            className={clsx(
              'absolute inset-0 bg-black/40',
              backdrop === 'blur' && 'backdrop-blur-[2px]'
            )}
            onClick={onClose}
          />
        )}

        {/* Card — outer wrapper carries shadow + rounded; inner clips overflow for children */}
        <div
          className={clsx(
            'relative z-10 rounded-xl',
            'shadow-[0_24px_64px_-12px_rgba(0,0,0,0.35),0_8px_24px_-4px_rgba(0,0,0,0.2)]',
            'max-h-[80vh]',
            SIZE_CLASS[size]
          )}
        >
          <div
            className={clsx(
              'flex flex-col h-full rounded-xl overflow-hidden',
              'bg-white dark:bg-gray-950',
              'border border-gray-200 dark:border-gray-700'
            )}
          >
            {/* Header */}
            <div
              className={clsx(
                'flex items-center justify-between px-4 py-3 flex-shrink-0',
                'border-b border-gray-200 dark:border-gray-700'
              )}
            >
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{title}</div>
              <button
                type="button"
                onClick={onClose}
                className={clsx(
                  'p-1 rounded-md transition-colors',
                  'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
                  'dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-800'
                )}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-col flex-1 min-h-0">{children}</div>
          </div>
        </div>
      </div>
    </ThemeWrapper>
  );
};
