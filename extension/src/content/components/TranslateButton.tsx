// TranslateButton.tsx — Translate icon button for title blocks (single-click, no mode selection)
// When translated: shows restore + retranslate + history actions inline

import clsx from 'clsx';
import { Clock, Loader2, RotateCcw, Undo2 } from 'lucide-react';
import type React from 'react';

import logoUrl from '../../assets/logo.png';
import { IconButton } from '../../components/IconButton';
import { ThemeWrapper } from '../../components/ThemeWrapper';
import { type BlockTypeEnum, TranslateStateEnum } from '../../enums';
import { useGlobalStore } from '../../store/global';
import type { ContextBlock } from '../../types';
import { useTranslate } from '../hooks/useTranslate';

interface Props {
  parsedContent: string;
  blockType: BlockTypeEnum;
  getElement: () => HTMLElement;
  getContextBlocks?: () => ContextBlock[];
  getContainerEl?: () => HTMLElement;
}

export const TranslateButton: React.FC<Props> = ({
  parsedContent,
  blockType,
  getElement,
  getContextBlocks,
  getContainerEl,
}) => {
  const { openSidebarToBlock } = useGlobalStore();
  const { state, translate, restore, retranslate, history } = useTranslate(
    parsedContent,
    blockType,
    getElement,
    getContextBlocks,
    getContainerEl
  );

  const isTranslated = state === TranslateStateEnum.Translated;
  const isLoading = state === TranslateStateEnum.Loading;

  const handleClick = () => {
    if (isLoading) return;
    if (isTranslated) {
      restore();
      return;
    }
    translate();
  };

  return (
    <ThemeWrapper>
      <div className="flex items-center gap-1" style={{ fontFamily: 'system-ui, sans-serif' }}>
        {/* Main toggle button */}
        <button
          className={clsx(
            'flex items-center justify-center w-7 h-7 rounded-full cursor-pointer p-1',
            'transition-all duration-150 select-none text-black',
            isTranslated ? 'bg-blue-400 hover:bg-blue-500' : 'bg-white hover:bg-gray-100'
          )}
          onClick={handleClick}
          title={isTranslated ? 'Show original' : 'Translate with AI'}
          type="button"
        >
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {isTranslated && <Undo2 className="w-3.5 h-3.5" />}
          {!isLoading && !isTranslated && (
            <img src={logoUrl} alt="Translate" className="w-full h-full object-contain" />
          )}
        </button>

        {/* Retranslate + History — visible only when showing translation */}
        {isTranslated && (
          <>
            <IconButton
              variant="outline"
              color="ghost"
              onClick={retranslate}
              disabled={isLoading}
              title="Retranslate"
            >
              <RotateCcw className="w-3 h-3" />
            </IconButton>

            {history.length > 0 && (
              <IconButton
                variant="outline"
                color="ghost"
                onClick={() => openSidebarToBlock(parsedContent)}
                title="View translation history"
              >
                <Clock className="w-3 h-3" />
              </IconButton>
            )}
          </>
        )}
      </div>
    </ThemeWrapper>
  );
};
