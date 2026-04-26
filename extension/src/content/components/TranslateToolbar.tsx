// TranslateToolbar.tsx — Toolbar above content blocks: toggle translated/raw + split translate button + history

import clsx from 'clsx';
import { ChevronDown, Clock, Loader2, RotateCcw } from 'lucide-react';
import type React from 'react';
import { useRef, useState } from 'react';

import { Button } from '../../components/Button';
import { IconButton } from '../../components/IconButton';
import { ThemeWrapper } from '../../components/ThemeWrapper';
import { Toggle } from '../../components/Toggle';
import { BlockTypeEnum, TranslateStateEnum } from '../../enums';
import { useGlobalStore } from '../../store/global';
import type { ContextBlock } from '../../types';
import { useTranslate } from '../hooks/useTranslate';
import type { TranslateOption } from './translateOptions';
import { COMMENT_OPTIONS, SIMPLE_OPTIONS } from './translateOptions';
import { TranslatePopup } from './TranslatePopup';

interface Props {
  blockId: string;
  blockType: BlockTypeEnum;
  getElement: () => HTMLElement;
  getContextBlocks?: () => ContextBlock[];
}

export const TranslateToolbar: React.FC<Props> = ({
  blockId,
  blockType,
  getElement,
  getContextBlocks,
}) => {
  const options = blockType === BlockTypeEnum.Comment ? COMMENT_OPTIONS : SIMPLE_OPTIONS;
  const [selectedOption, setSelectedOption] = useState<TranslateOption>(options[0]);
  const [popupOpen, setPopupOpen] = useState(false);
  const dropdownRef = useRef<HTMLButtonElement>(null);
  const { openSidebarToBlock } = useGlobalStore();

  const { state, translate, retranslate, restore, hasTranslation, history } = useTranslate(
    blockId,
    blockType,
    getElement,
    getContextBlocks
  );

  const isTranslated = state === TranslateStateEnum.Translated;
  const isLoading = state === TranslateStateEnum.Loading;

  const handleToggle = (checked: boolean) => {
    if (checked) translate();
    else restore();
  };

  const handleSelectMode = (mode: string) => {
    const opt = options.find((o) => o.value === mode);
    if (opt) setSelectedOption(opt);
  };

  return (
    <ThemeWrapper>
      <div
        className="flex justify-start items-center gap-2"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        {/* Split button: [label] | [▼] */}
        <div
          className={clsx(
            'flex items-center rounded border shadow-sm overflow-hidden',
            'border-gray-200 bg-white',
            'dark:border-gray-600 dark:bg-gray-950'
          )}
        >
          <button
            type="button"
            onClick={translate}
            disabled={isLoading}
            title={selectedOption.sublabel}
            className={clsx(
              'flex items-center gap-1 px-2 py-1 text-xs transition-colors disabled:opacity-60',
              'text-gray-700 hover:bg-gray-50',
              'dark:text-gray-200 dark:hover:bg-gray-800'
            )}
          >
            {isLoading && <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />}
            <span className="whitespace-nowrap">{selectedOption.label}</span>
          </button>

          <div className={clsx('w-px h-4 flex-shrink-0', 'bg-gray-200', 'dark:bg-gray-700')} />

          <button
            ref={dropdownRef}
            type="button"
            onClick={() => setPopupOpen((v) => !v)}
            title="Select translation mode"
            className={clsx(
              'flex items-center justify-center px-1.5 py-1 transition-colors',
              'hover:bg-gray-50',
              'dark:hover:bg-gray-800'
            )}
          >
            <ChevronDown className={clsx('w-3 h-3', 'text-gray-500', 'dark:text-gray-400')} />
          </button>
        </div>

        {/* Retranslate button — shown when there's a prior translation */}
        {hasTranslation && (
          <IconButton
            variant="outline"
            color="ghost"
            onClick={retranslate}
            disabled={isLoading}
            title="Retranslate"
          >
            <RotateCcw className="w-3 h-3" />
          </IconButton>
        )}

        {/* History button — shown when there are history entries */}
        {history.length > 0 && (
          <Button
            variant="outline"
            color="ghost"
            size="sm"
            onClick={() => openSidebarToBlock(blockId)}
            title="View translation history"
          >
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span>History</span>
          </Button>
        )}

        {/* Toggle — appears after first translation to switch between translated/raw */}
        {hasTranslation && (
          <Toggle checked={isTranslated} onChange={handleToggle} label="Show translation" />
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
    </ThemeWrapper>
  );
};
