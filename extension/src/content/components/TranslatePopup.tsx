// TranslatePopup.tsx — Mode-selection popup portalled to document.body via shadow root for z-index + Tailwind support

import clsx from 'clsx';
import type React from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { ThemeWrapper } from '../../components/ThemeWrapper';
import { BlockTypeEnum } from '../../enums';
import { createShadowHost } from '../dom/shadowDom';
import { COMMENT_OPTIONS, SIMPLE_OPTIONS } from './translateOptions';

interface Props {
  blockType: BlockTypeEnum;
  anchorRef: React.RefObject<HTMLElement | null>;
  onSelect: (mode: string) => void;
  onClose: () => void;
}

export const TranslatePopup: React.FC<Props> = ({ blockType, anchorRef, onSelect, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);
  const options = blockType === BlockTypeEnum.Comment ? COMMENT_OPTIONS : SIMPLE_OPTIONS;

  const [position, setPosition] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (rect) setPosition({ top: rect.bottom + 4, left: rect.left });
  }, [anchorRef]);

  // useState with lazy initializer: creates the shadow host once on mount.
  // The host is not appended to document.body here — that's done in useEffect below.
  const [portal] = useState(() =>
    createShadowHost('position:absolute;top:0;left:0;width:0;height:0;z-index:999999;')
  );

  useEffect(() => {
    document.body.appendChild(portal.host);
    return () => {
      document.body.removeChild(portal.host);
    };
  }, [portal.host]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !e.composedPath().includes(ref.current)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return createPortal(
    <ThemeWrapper>
      <div
        ref={ref}
        className={clsx(
          'fixed w-64 rounded-lg shadow-lg border overflow-hidden',
          'border-gray-200 bg-white',
          'dark:border-gray-700 dark:bg-gray-900'
        )}
        style={{ top: position.top, left: position.left, fontFamily: 'system-ui, sans-serif' }}
      >
        {options.map((opt, i) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              onSelect(opt.value);
              onClose();
            }}
            className={clsx(
              'w-full text-left p-3 cursor-pointer transition-colors',
              i < options.length - 1 && 'border-b',
              'border-gray-100 hover:bg-gray-100',
              'dark:border-gray-800 dark:hover:bg-gray-800'
            )}
          >
            <div
              className={clsx(
                'text-xs font-semibold leading-tight',
                'text-gray-800',
                'dark:text-gray-100'
              )}
            >
              {opt.label}
            </div>
            <div
              className={clsx(
                'text-xs mt-0.5 leading-tight',
                'text-gray-500',
                'dark:text-gray-400'
              )}
            >
              {opt.sublabel}
            </div>
          </button>
        ))}
      </div>
    </ThemeWrapper>,
    portal.mount
  );
};
