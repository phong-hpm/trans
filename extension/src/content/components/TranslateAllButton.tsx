// TranslateAllButton.tsx — Fixed floating button that batch-translates all blocks in one API call

import clsx from 'clsx';
import { Languages, Loader2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { ThemeWrapper } from '../../components/ThemeWrapper';
import type { Block } from '../../platforms/types';
import { batchTranslateAll } from '../batchTranslate';

interface Props {
  getBlocks: () => Block[];
}

export const TranslateAllButton: React.FC<Props> = ({ getBlocks }) => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const totalRef = useRef(0);
  const doneRef = useRef(0);
  // Ref-based guard for atomic double-click protection (state updates are async/batched)
  const isTranslatingRef = useRef(false);

  // Count individual block completions dispatched after batch result is applied
  useEffect(() => {
    const handler = () => {
      doneRef.current += 1;
      setDone(doneRef.current);
      if (doneRef.current >= totalRef.current) {
        isTranslatingRef.current = false;
        setIsTranslating(false);
      }
    };
    document.addEventListener('trans:translate-done', handler);
    return () => document.removeEventListener('trans:translate-done', handler);
  }, []);

  const handleClick = useCallback(async () => {
    // Ref guard is atomic; state guard is for UI disabled state
    if (isTranslatingRef.current) return;

    const blocks = getBlocks();
    if (!blocks.length) return;

    isTranslatingRef.current = true;
    // Set total upfront so the progress counter works as blocks complete
    totalRef.current = blocks.length;
    doneRef.current = 0;
    setTotal(blocks.length);
    setDone(0);
    setIsTranslating(true);

    try {
      const count = await batchTranslateAll(blocks);
      if (!count) {
        // No segments found — nothing to do
        isTranslatingRef.current = false;
        setIsTranslating(false);
        return;
      }
      // All entries saved to history — trigger each block to apply from history (no API call)
      document.dispatchEvent(new CustomEvent('trans:translate-all'));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Batch translation failed';
      toast.error(msg);
      isTranslatingRef.current = false;
      setIsTranslating(false);
    }
  }, [getBlocks]);

  return (
    <ThemeWrapper>
      <button
        type="button"
        onClick={handleClick}
        disabled={isTranslating}
        title="Translate all blocks"
        className={clsx(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
          'shadow-md border',
          isTranslating
            ? 'border-blue-200 bg-blue-50 text-blue-600 cursor-not-allowed dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400'
            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:shadow-lg dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800'
        )}
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        {isTranslating ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
            <span className="whitespace-nowrap tabular-nums">
              {done}/{total}
            </span>
          </>
        ) : (
          <>
            <Languages className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="whitespace-nowrap">Translate all</span>
          </>
        )}
      </button>
    </ThemeWrapper>
  );
};
