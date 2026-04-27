// TranslateAllButton.tsx — Button that triggers translation of all blocks on the page at once

import clsx from 'clsx';
import { Languages, Loader2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ThemeWrapper } from '../../components/ThemeWrapper';

interface Props {
  getBlockCount: () => number;
}

export const TranslateAllButton: React.FC<Props> = ({ getBlockCount }) => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const totalRef = useRef(0);
  const doneRef = useRef(0);

  useEffect(() => {
    const handler = () => {
      doneRef.current += 1;
      setDone(doneRef.current);
      if (doneRef.current >= totalRef.current) {
        setIsTranslating(false);
      }
    };
    document.addEventListener('trans:translate-done', handler);
    return () => document.removeEventListener('trans:translate-done', handler);
  }, []);

  const handleClick = useCallback(() => {
    if (isTranslating) return;
    const count = getBlockCount();
    if (!count) return;
    totalRef.current = count;
    doneRef.current = 0;
    setTotal(count);
    setDone(0);
    setIsTranslating(true);
    document.dispatchEvent(new CustomEvent('trans:translate-all'));
  }, [isTranslating, getBlockCount]);

  return (
    <ThemeWrapper>
      <button
        type="button"
        onClick={handleClick}
        disabled={isTranslating}
        title="Translate all blocks"
        className={clsx(
          'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors',
          'border shadow-sm',
          isTranslating
            ? 'border-blue-200 bg-blue-50 text-blue-600 cursor-not-allowed dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400'
            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-800'
        )}
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        {isTranslating ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />
            <span className="whitespace-nowrap tabular-nums">
              {done}/{total}
            </span>
          </>
        ) : (
          <>
            <Languages className="w-3 h-3 flex-shrink-0" />
            <span className="whitespace-nowrap">Translate all</span>
          </>
        )}
      </button>
    </ThemeWrapper>
  );
};
