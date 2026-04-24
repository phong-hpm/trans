// Select.tsx — Reusable labeled select component

import clsx from 'clsx';
import type React from 'react';

interface Option {
  value: string;
  label: string;
}

interface Props extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}

export const Select: React.FC<Props> = ({ label, value, options, onChange, disabled, ...rest }) => (
  <div>
    <div
      className={clsx(
        'block text-xs font-medium mb-1',
        'text-gray-600',
        'dark:text-gray-300',
      )}
    >
      {label}
    </div>
    <select
      {...rest}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={clsx(
        'w-full text-sm border rounded-md px-1.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed',
        'border-gray-300 bg-white text-gray-900',
        'dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100'
      )}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);
