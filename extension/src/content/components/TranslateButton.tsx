import { Languages, Loader2, RotateCcw } from 'lucide-react';
import type React from 'react';
import type { ExtensionSettings } from '../../types';
import { useTranslate } from '../hooks/useTranslate';

interface Props {
  getSettings: () => Promise<ExtensionSettings>;
  getText: () => string;
  onTranslate: (translated: string) => void;
  onRestore: () => void;
}

export const TranslateButton: React.FC<Props> = ({
  getSettings,
  getText,
  onTranslate,
  onRestore,
}) => {
  const { state, trigger } = useTranslate(getSettings, getText, onTranslate, onRestore);

  const btnCls = [
    'flex items-center justify-center w-7 h-7 rounded cursor-pointer',
    'border text-xs transition-colors duration-150 select-none',
    state === 'translated'
      ? 'bg-blue-50 border-blue-400 text-blue-600 hover:bg-blue-100'
      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-700',
  ].join(' ');

  const tooltip = state === 'translated' ? 'Show original' : 'Translate with AI';

  return (
    <div className="relative inline-block" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <button className={btnCls} onClick={trigger} title={tooltip} type="button">
        {state === 'loading' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {state === 'translated' && <RotateCcw className="w-3.5 h-3.5" />}
        {state === 'idle' && <Languages className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
};
