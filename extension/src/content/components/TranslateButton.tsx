// TranslateButton.tsx — Translate icon button with inline mode-selection popup

import clsx from 'clsx';
import { Loader2, RotateCcw } from 'lucide-react';
import type React from 'react';
import { useRef, useState } from 'react';

import logoUrl from '../../assets/logo.png';
import { type BlockTypeEnum, TranslateStateEnum } from '../../enums';
import type { ContextBlock } from '../../types';
import { useTranslate } from '../hooks/useTranslate';
import { TranslatePopup } from './TranslatePopup';

interface Props {
  blockId: string;
  blockType: BlockTypeEnum;
  getElement: () => HTMLElement;
  getContextBlocks?: () => ContextBlock[];
}

export const TranslateButton: React.FC<Props> = ({
  blockId,
  blockType,
  getElement,
  getContextBlocks,
}) => {
  const [popupOpen, setPopupOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { state, translate, restore } = useTranslate(
    blockId,
    blockType,
    getElement,
    getContextBlocks
  );

  const handleClick = () => {
    if (state === TranslateStateEnum.Loading) return;
    if (state === TranslateStateEnum.Translated) {
      restore();
      return;
    }
    setPopupOpen((v) => !v);
  };

  const handleSelect = (_mode: string) => {
    translate();
  };

  const tooltip = state === TranslateStateEnum.Translated ? 'Show original' : 'Translate with AI';

  return (
    <div className="relative w-7 h-7" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <button
        className={clsx(
          'flex items-center justify-center w-7 h-7 rounded-full cursor-pointer p-1',
          'transition-all duration-150 select-none text-black',
          state === TranslateStateEnum.Translated
            ? 'bg-blue-400 hover:bg-blue-500'
            : 'bg-white hover:bg-gray-100'
        )}
        ref={buttonRef}
        onClick={handleClick}
        title={tooltip}
        type="button"
      >
        {state === TranslateStateEnum.Loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {state === TranslateStateEnum.Translated && <RotateCcw className="w-3.5 h-3.5" />}
        {state === TranslateStateEnum.Idle && (
          <img src={logoUrl} alt="Translate" className="w-full h-full object-contain" />
        )}
      </button>

      {popupOpen && (
        <TranslatePopup
          blockType={blockType}
          anchorRef={buttonRef}
          onSelect={handleSelect}
          onClose={() => setPopupOpen(false)}
        />
      )}
    </div>
  );
};
