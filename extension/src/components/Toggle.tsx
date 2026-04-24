// Toggle.tsx — Reusable toggle switch component

import clsx from 'clsx';
import type React from 'react';

interface Props {
  checked: boolean;
  onChange: (value: boolean) => void;
}

export const Toggle: React.FC<Props> = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={clsx(
      'relative w-10 h-6 rounded-full transition-colors duration-200 flex-shrink-0',
      checked ? 'bg-gray-900' : 'bg-gray-200'
    )}
  >
    <span
      className={clsx(
        'absolute top-0.5 left-0 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
        checked ? 'translate-x-[18px]' : 'translate-x-0.5'
      )}
    />
  </button>
);
