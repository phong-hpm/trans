// TranslateToolbar.tsx — Toolbar above content blocks: toggle translated/raw + split translate button

import { ChevronDown, Loader2 } from 'lucide-react';
import type React from 'react';
import { useRef, useState } from 'react';
import { Toggle } from '../../components/Toggle';
import type { BlockType, ContextBlock, ExtensionSettings } from '../../types';
import { useTranslate } from '../hooks/useTranslate';
import { COMMENT_OPTIONS, SIMPLE_OPTIONS, TranslatePopup } from './TranslatePopup';
import type { TranslateOption } from './TranslatePopup';

interface Props {
  blockId: string;
  blockType: BlockType;
  getSettings: () => Promise<ExtensionSettings>;
  getElement: () => HTMLElement;
  getContextBlocks?: () => ContextBlock[];
}

export const TranslateToolbar: React.FC<Props> = ({
  blockId,
  blockType,
  getSettings,
  getElement,
  getContextBlocks,
}) => {
  const options = blockType === 'comment' ? COMMENT_OPTIONS : SIMPLE_OPTIONS;
  const [selectedOption, setSelectedOption] = useState<TranslateOption>(options[0]);
  const [popupOpen, setPopupOpen] = useState(false);
  const dropdownRef = useRef<HTMLButtonElement>(null);

  const { state, translate, restore, hasTranslation } = useTranslate(
    blockId,
    blockType,
    getSettings,
    getElement,
    getContextBlocks
  );

  const isTranslated = state === 'translated';
  const isLoading = state === 'loading';

  const handleToggle = (checked: boolean) => {
    if (checked) translate();
    else restore();
  };

  const handleSelectMode = (mode: string) => {
    const opt = options.find((o) => o.value === mode);
    if (opt) setSelectedOption(opt);
  };

  return (
    <div className='flex items-center gap-2' style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Split button: [label] | [▼] */}
      <div className='flex items-center rounded border border-gray-200 bg-white shadow-sm overflow-hidden'>
        <button
          type='button'
          onClick={translate}
          disabled={isLoading}
          title={selectedOption.sublabel}
          className='flex items-center gap-1 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60'
        >
          {isLoading && <Loader2 className='w-3 h-3 animate-spin flex-shrink-0' />}
          <span className='whitespace-nowrap'>{selectedOption.label}</span>
        </button>

        <div className='w-px h-4 bg-gray-200 flex-shrink-0' />

        <button
          ref={dropdownRef}
          type='button'
          onClick={() => setPopupOpen((v) => !v)}
          title='Select translation mode'
          className='flex items-center justify-center px-1.5 py-1 hover:bg-gray-50 transition-colors'
        >
          <ChevronDown className='w-3 h-3 text-gray-500' />
        </button>
      </div>

      {/* Toggle — appears after first translation to switch between translated/raw */}
      {hasTranslation && (
        <Toggle
          checked={isTranslated}
          onChange={handleToggle}
          label={isTranslated ? 'Showing translated' : 'Showing original'}
        />
      )}

      {popupOpen && (
        <TranslatePopup
          blockType={blockType}
          anchorRef={dropdownRef}
          onSelect={(mode) => {
            handleSelectMode(mode);
          }}
          onClose={() => setPopupOpen(false)}
        />
      )}
    </div>
  );
};
