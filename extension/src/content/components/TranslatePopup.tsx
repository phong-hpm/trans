// TranslatePopup.tsx — Inline mode-selection popup rendered inside shadow DOM

import type React from 'react';
import { useEffect, useRef } from 'react';
import type { BlockType } from '../../types';

interface Option {
  label: string;
  sublabel: string;
  value: string;
}

const COMMENT_OPTIONS: Option[] = [
  {
    value: 'full',
    label: 'Full Context Translation',
    sublabel: 'Best accuracy – full task + all previous comments',
  },
  {
    value: 'context',
    label: 'Context-Aware Translation',
    sublabel: 'Balanced – task + this comment',
  },
  {
    value: 'direct',
    label: 'Direct Translation',
    sublabel: 'Lowest cost – this comment only',
  },
];

const SIMPLE_OPTIONS: Option[] = [
  { value: 'translate', label: 'Translation', sublabel: '' },
];

interface Props {
  blockType: BlockType;
  onSelect: (mode: string) => void;
  onClose: () => void;
}

export const TranslatePopup: React.FC<Props> = ({ blockType, onSelect, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);
  const options = blockType === 'comment' ? COMMENT_OPTIONS : SIMPLE_OPTIONS;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !e.composedPath().includes(ref.current)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1 z-50 w-64 rounded-lg shadow-lg border border-gray-200 bg-white overflow-hidden"
      style={{ fontFamily: 'system-ui, sans-serif' }}
    >
      {options.map((opt, i) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => { onSelect(opt.value); onClose(); }}
          className={`w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors ${
            i < options.length - 1 ? 'border-b border-gray-100' : ''
          }`}
        >
          <div className="text-xs font-semibold text-gray-800 leading-tight">{opt.label}</div>
          {opt.sublabel && (
            <div className="text-xs text-gray-400 mt-0.5 leading-tight">{opt.sublabel}</div>
          )}
        </button>
      ))}
    </div>
  );
};
