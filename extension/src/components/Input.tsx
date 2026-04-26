// Input.tsx — Reusable labeled text input component

import clsx from 'clsx';
import type React from 'react';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Input: React.FC<Props> = ({ label, ...props }) => (
  <div>
    <div className={clsx('block text-xs font-medium mb-1', 'text-gray-600', 'dark:text-gray-300')}>
      {label}
    </div>
    <input
      {...props}
      className={clsx(
        'w-full text-sm border rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
        'border-gray-300 bg-white text-gray-900 placeholder:text-gray-400',
        'dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-500'
      )}
    />
  </div>
);
