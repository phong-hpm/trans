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
    {label && (
      <div>
        <div className='text-xs font-medium text-gray-700'>{label}</div>
        {sublabel && <div className='text-xs text-gray-400 mt-0.5'>{sublabel}</div>}
      </div>
    )}
  </div>
);
