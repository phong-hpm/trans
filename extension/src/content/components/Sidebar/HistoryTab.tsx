// Sidebar/HistoryTab.tsx — History tab: lists all block translation histories for the current page

import clsx from 'clsx';
import type React from 'react';
import { useEffect, useRef } from 'react';

import { ConfirmButton } from '../../../components/Button';
import { useGlobalStore } from '../../../store/global';
import { useHistoryStore } from '../../../store/history';
import { useBlockHistories } from '../../hooks/useBlockHistories';
import { BlockCollapse } from './BlockCollapse';

interface Props {
  /** Persisted open/closed state — passed from Sidebar so it survives close/reopen cycles */
  openBlocks: Record<string, boolean>;
  /** Set a specific block open or closed */
  onSetBlock: (parsedContent: string, open: boolean) => void;
}

export const HistoryTab: React.FC<Props> = ({ openBlocks, onSetBlock }) => {
  const { focusedParsedContent, clearFocusedBlock, platformName } = useGlobalStore();
  const pageCount = useHistoryStore((s) => s.histories.length);
  const clearPage = useHistoryStore((s) => s.clearPage);
  const histories = useBlockHistories();
  const itemRefs = useRef<Record<string, HTMLElement | null>>({});

  // When focusedParsedContent changes, open that block and scroll to it
  useEffect(() => {
    if (!focusedParsedContent) return;
    onSetBlock(focusedParsedContent, true); // force-open the focused block
    requestAnimationFrame(() => {
      itemRefs.current[focusedParsedContent]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      clearFocusedBlock();
    });
  }, [focusedParsedContent, clearFocusedBlock, onSetBlock]);

  const pageInfo = (
    <div className="mt-auto border-t border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
      {platformName ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={clsx(
                'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                'border-blue-200 bg-blue-50 text-blue-600',
                'dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400'
              )}
            >
              {platformName}
            </span>
            <span className="truncate text-[10px] text-gray-400 dark:text-gray-500">
              {location.pathname}
            </span>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Saved translations:{' '}
            <span className="font-semibold text-gray-800 dark:text-gray-100">{pageCount}</span>
          </p>

          <ConfirmButton
            variant="contain"
            color="danger"
            size="md"
            fullWidth
            disabled={pageCount === 0}
            onConfirm={clearPage}
            confirmMessage="This will remove all saved translations for this page."
          >
            Clear page history
          </ConfirmButton>
        </div>
      ) : (
        <div
          className={clsx(
            'space-y-1 rounded-lg border px-3 py-3 text-xs',
            'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30'
          )}
        >
          <p className="font-semibold text-amber-700 dark:text-amber-400">Page not supported</p>
          <p className="text-amber-600 dark:text-amber-500">
            Translation is only available on supported platforms.
          </p>
        </div>
      )}
    </div>
  );

  if (!histories.length) {
    return (
      <div className="flex-shrink-0 flex min-h-full flex-col">
        <div
          className={clsx(
            'flex flex-1 flex-col items-center justify-center px-4 py-12 text-center',
            'text-gray-400',
            'dark:text-gray-500'
          )}
        >
          <p className="text-sm">No translations yet.</p>
          <p className="mt-1 text-xs">Translate a block to see its history here.</p>
        </div>
        {pageInfo}
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex-grow py-1">
        {histories.map((item) => (
          <BlockCollapse
            key={item.parsedContent}
            parsedContent={item.parsedContent}
            history={item.history}
            preview={item.preview}
            isOpen={!!openBlocks[item.parsedContent]}
            onToggle={() => onSetBlock(item.parsedContent, !openBlocks[item.parsedContent])}
            refCallback={(el) => {
              itemRefs.current[item.parsedContent] = el;
            }}
          />
        ))}
      </div>
      {pageInfo}
    </div>
  );
};
