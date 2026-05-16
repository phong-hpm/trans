// TranslateAllButton.tsx — Floating extension launcher with settings and batch translate actions

import clsx from 'clsx';
import { Languages, Loader2, Settings } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import extensionIconUrl from '../../../icons/icon128.png';
import { ThemeWrapper } from '../../components/ThemeWrapper';
import type { PlatformBlock } from '../../platforms/types';
import { useGlobalStore } from '../../store/global';
import { useTranslateAll } from '../hooks/useTranslateAll';

interface Props {
  getBlocks: () => PlatformBlock[];
}

export const TranslateAllButton: React.FC<Props> = ({ getBlocks }) => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const { openSettingsPanel } = useGlobalStore();
  const { onTranslateAll } = useTranslateAll();
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
      const count = await onTranslateAll(blocks);
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
  }, [onTranslateAll, getBlocks]);

  return (
    <ThemeWrapper>
      <div
        className="group pointer-events-auto fixed bottom-[72px] right-4 z-[9990] flex h-10 items-center justify-end"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        <div
          className={clsx(
            'absolute bottom-10 right-0 flex min-w-36 flex-col items-end gap-1 pb-2',
            'pointer-events-none translate-y-1 opacity-0 transition-all duration-150',
            'group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100',
            'group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100'
          )}
        >
          <button
            type="button"
            onClick={openSettingsPanel}
            className={clsx(
              'flex items-center justify-end gap-2 rounded px-1.5 py-1 text-right text-xs font-medium transition-colors',
              'bg-white/90 text-gray-700 hover:text-gray-950',
              'dark:bg-gray-900/90 dark:text-gray-200 dark:hover:text-white'
            )}
          >
            <span className="whitespace-nowrap">Settings</span>
            <Settings className="h-3.5 w-3.5 flex-shrink-0" />
          </button>

          <button
            type="button"
            onClick={handleClick}
            disabled={isTranslating}
            className={clsx(
              'flex items-center justify-end gap-2 rounded px-1.5 py-1 text-right text-xs font-medium transition-colors',
              'bg-white/90 text-gray-700 hover:text-gray-950 disabled:cursor-not-allowed disabled:opacity-60',
              'dark:bg-gray-900/90 dark:text-gray-200 dark:hover:text-white'
            )}
          >
            <span className="whitespace-nowrap">Translate all</span>
            {isTranslating ? (
              <Loader2 className="h-3.5 w-3.5 flex-shrink-0 animate-spin" />
            ) : (
              <Languages className="h-3.5 w-3.5 flex-shrink-0" />
            )}
          </button>
        </div>

        <button
          type="button"
          title="Task Translator"
          className={clsx(
            'relative flex h-10 w-10 items-center justify-center rounded-full border bg-white p-1.5 shadow-md',
            'transition-all duration-150 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
            'border-gray-200 dark:border-gray-600 dark:bg-gray-900'
          )}
        >
          <img
            src={extensionIconUrl}
            alt="Task Translator"
            className="h-full w-full rounded-full"
          />
          {isTranslating && (
            <span
              className={clsx(
                'absolute -right-1 -top-1 rounded-full border px-1 text-[10px] font-medium tabular-nums',
                'border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400'
              )}
            >
              {done}/{total}
            </span>
          )}
        </button>
      </div>
    </ThemeWrapper>
  );
};
