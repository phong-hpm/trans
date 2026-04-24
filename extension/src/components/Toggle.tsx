// Toggle.tsx — Reusable toggle switch component with optional label and sublabel

import clsx from 'clsx';
import type React from 'react';

interface Props {
  label?: string;
  sublabel?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

export const Toggle: React.FC<Props> = ({ label, sublabel, checked, onChange }) => (
  <div className='flex items-center gap-3 cursor-pointer select-none' onClick={() => onChange(!checked)}>
    <button
      type='button'
      className={clsx(
        'relative w-8 h-5 rounded-full transition-colors duration-200 flex-shrink-0 border',
        checked ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300',
        checked ? 'dark:bg-blue-500 dark:border-blue-500' : 'dark:bg-gray-950 dark:border-gray-700',
      )}
    >
      <span
        className={clsx(
          'absolute top-[1px] left-0 w-4 h-4 rounded-full shadow transition-transform duration-200',
          checked ? 'bg-white translate-x-[14px]' : 'bg-gray-400 translate-x-[1px]',
          checked ? 'dark:bg-white' : 'dark:bg-gray-500',
        )}
      />
    </button>
    {label && (
      <div>
        <div
          className={clsx(
            'text-xs font-medium',
            'text-gray-700',
            'dark:text-gray-200',
          )}
        >
          {label}
        </div>
        {sublabel && (
          <div
            className={clsx(
              'text-xs mt-0.5',
              'text-gray-400',
              'dark:text-gray-500',
            )}
          >
            {sublabel}
          </div>
        )}
      </div>
    )}
  </div>
);
