// TranslateToolbar.tsx — Toolbar above content blocks: toggle translated/raw + split translate button + history

import clsx from 'clsx';
import { ChevronDown, Clock, Loader2, RotateCcw } from 'lucide-react';
import type React from 'react';
import { useRef, useState } from 'react';
import { Toggle } from '../../components/Toggle';
import type { BlockType, ContextBlock } from '../../types';
import { useGlobalStore } from '../../store/global';
import { useTranslate } from '../hooks/useTranslate';
import { COMMENT_OPTIONS, SIMPLE_OPTIONS, TranslatePopup } from './TranslatePopup';
import type { TranslateOption } from './TranslatePopup';

interface Props {
  blockId: string;
  blockType: BlockType;
  getElement: () => HTMLElement;
  getContextBlocks?: () => ContextBlock[];
}

export const TranslateToolbar: React.FC<Props> = ({
  blockId,
  blockType,
  getElement,
  getContextBlocks,
}) => {
  const options = blockType === 'comment' ? COMMENT_OPTIONS : SIMPLE_OPTIONS;
  const [selectedOption, setSelectedOption] = useState<TranslateOption>(options[0]);
  const [popupOpen, setPopupOpen] = useState(false);
  const dropdownRef = useRef<HTMLButtonElement>(null);
  const { theme, openSidebarToBlock } = useGlobalStore();

  const { state, translate, retranslate, restore, hasTranslation, history } = useTranslate(
    blockId,
    blockType,
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
    <div className={theme.themeClass}>
      <div className='flex justify-start items-center gap-2' style={{ fontFamily: 'system-ui, sans-serif' }}>
        {/* Split button: [label] | [▼] */}
        <div
          className={clsx(
            'flex items-center rounded border shadow-sm overflow-hidden',
            'border-gray-200 bg-white',
            'dark:border-gray-600 dark:bg-gray-950',
          )}
        >
          <button
            type='button'
            onClick={translate}
            disabled={isLoading}
            title={selectedOption.sublabel}
            className={clsx(
              'flex items-center gap-1 px-2 py-1 text-xs transition-colors disabled:opacity-60',
              'text-gray-700 hover:bg-gray-50',
              'dark:text-gray-200 dark:hover:bg-gray-800',
            )}
          >
            {isLoading && <Loader2 className='w-3 h-3 animate-spin flex-shrink-0' />}
            <span className='whitespace-nowrap'>{selectedOption.label}</span>
          </button>

          <div
            className={clsx(
              'w-px h-4 flex-shrink-0',
              'bg-gray-200',
              'dark:bg-gray-700',
            )}
          />

          <button
            ref={dropdownRef}
            type='button'
            onClick={() => setPopupOpen((v) => !v)}
            title='Select translation mode'
            className={clsx(
              'flex items-center justify-center px-1.5 py-1 transition-colors',
              'hover:bg-gray-50',
              'dark:hover:bg-gray-800',
            )}
          >
            <ChevronDown
              className={clsx(
                'w-3 h-3',
                'text-gray-500',
                'dark:text-gray-400',
              )}
            />
          </button>
        </div>

        {/* Retranslate button — shown when there's a prior translation */}
        {hasTranslation && (
          <button
            type='button'
            onClick={retranslate}
            disabled={isLoading}
            title='Retranslate'
            className={clsx(
              'flex items-center justify-center w-6 h-6 rounded border transition-colors disabled:opacity-60',
              'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700',
              'dark:border-gray-600 dark:bg-gray-950 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200',
            )}
          >
            <RotateCcw className='w-3 h-3' />
          </button>
        )}

        {/* History button — shown when there are history entries */}
        {history.length > 0 && (
          <button
            type='button'
            onClick={() => openSidebarToBlock(blockId)}
            title='View translation history'
            className={clsx(
              'flex items-center gap-1 px-2 py-1 rounded border text-xs transition-colors',
              'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700',
              'dark:border-gray-600 dark:bg-gray-950 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200',
            )}
          >
            <Clock className='w-3 h-3 flex-shrink-0' />
            <span>History</span>
          </button>
        )}

        {/* Toggle — appears after first translation to switch between translated/raw */}
        {hasTranslation && (
          <Toggle
            checked={isTranslated}
            onChange={handleToggle}
            label='Show translation'
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
    </div>
  );
};
