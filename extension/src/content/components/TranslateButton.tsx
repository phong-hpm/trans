// TranslateButton.tsx — Translate/restore toggle button rendered inside shadow DOM

import { Languages, Loader2, RotateCcw } from 'lucide-react';
import type React from 'react';
import type { ExtensionSettings } from '../../types';
import { useTranslate } from '../hooks/useTranslate';
import clsx from 'clsx';

interface Props {
  blockId: string;
  getSettings: () => Promise<ExtensionSettings>;
  getElement: () => HTMLElement;
}

export const TranslateButton: React.FC<Props> = ({ blockId, getSettings, getElement }) => {
  const { state, trigger } = useTranslate(blockId, getSettings, getElement);

  const tooltip = state === 'translated' ? 'Show original' : 'Translate with AI';

  return (
    <div className='relative inline-block' style={{ fontFamily: 'system-ui, sans-serif' }}>
      <button
        className={clsx(
          'flex items-center justify-center w-7 h-7 rounded-full cursor-pointer',
          'transition-all duration-150 select-none text-black',
          state === 'translated' ? 'bg-blue-400/50 hover:bg-blue-400/70' : 'bg-white/50 hover:bg-white/70'
        )}
        onClick={trigger}
        title={tooltip}
        type='button'
      >
        {state === 'loading' && <Loader2 className='w-3.5 h-3.5 animate-spin' />}
        {state === 'translated' && <RotateCcw className='w-3.5 h-3.5' />}
        {state === 'idle' && <Languages className='w-3.5 h-3.5' />}
      </button>
    </div>
  );
};
