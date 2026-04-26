// TextareaInput.tsx — Reusable labeled textarea component with optional help text

import clsx from 'clsx';
import type React from 'react';

interface Props extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  helpText?: React.ReactNode;
}

export const TextareaInput: React.FC<Props> = ({ label, helpText, ...props }) => (
  <div className="space-y-1.5">
    <label className={clsx('block text-xs font-medium', 'text-gray-600', 'dark:text-gray-300')}>
      {label}
    </label>
    <textarea
      {...props}
      className={clsx(
        'w-full resize-none text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
        'border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400',
        'dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-500'
      )}
    />
    {helpText && (
      <p className="text-[10px] leading-relaxed text-gray-400 dark:text-gray-500">{helpText}</p>
    )}
  </div>
);
