// Sidebar/BlockCollapse.tsx — Collapsible block entry showing translation history entries

import clsx from 'clsx';
import { ChevronDown, Trash2 } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';

import { ConfirmIconButton } from '../../../components/IconButton';
import { BlockTypeEnum } from '../../../enums';
import type { BlockHistory } from '../../../types';
import { deleteEntry, selectEntry } from '../../translationSync';

interface Props {
  parsedContent: string;
  history: BlockHistory;
  preview: string;
  isOpen: boolean;
  onToggle: () => void;
  refCallback: (el: HTMLElement | null) => void;
}

export const BlockCollapse: React.FC<Props> = ({
  parsedContent,
  history,
  preview,
  isOpen,
  onToggle,
  refCallback,
}) => {
  const entryCount = history.entries.length;
  const blockType = history.blockType ?? BlockTypeEnum.Task;
  const blockTypeLabel = blockType === BlockTypeEnum.Comment ? 'Comment' : 'Task';

  // Sort entries newest first — memoized so we don't re-sort on unrelated renders
  const sorted = useMemo(
    () => [...history.entries].sort((a, b) => b.createdAt - a.createdAt),
    [history.entries]
  );

  const handleSelectEntry = (entryId: string) => {
    selectEntry(parsedContent, entryId);
  };

  return (
    <div ref={refCallback} className="px-2 py-1">
      {/* Collapsed header */}
      <button
        type="button"
        onClick={onToggle}
        className={clsx(
          'w-full flex items-center gap-2 rounded-md border px-3 py-2 text-left shadow-sm transition-colors',
          isOpen ? 'rounded-b-none' : '',
          'border-gray-200 bg-white hover:bg-gray-50',
          'dark:border-gray-700 dark:bg-gray-950 dark:hover:bg-gray-900'
        )}
      >
        <span
          className={clsx(
            'flex-shrink-0 text-[10px] font-semibold uppercase tracking-wide',
            'text-violet-600',
            'dark:text-violet-400'
          )}
        >
          {blockTypeLabel}
        </span>

        <span
          className={clsx(
            'min-w-0 flex-1 truncate text-xs font-medium',
            'text-gray-900',
            'dark:text-gray-100'
          )}
        >
          {preview}
        </span>

        <span
          className={clsx(
            'flex-shrink-0 text-xs font-medium tabular-nums',
            'text-gray-400',
            'dark:text-gray-500'
          )}
        >
          {entryCount}
        </span>

        <ChevronDown
          className={clsx(
            'h-3.5 w-3.5 flex-shrink-0 transition-transform',
            !isOpen && '-rotate-90',
            'text-gray-400 dark:text-gray-500'
          )}
        />
      </button>

      {/* Expanded entry list */}
      {isOpen && (
        <div
          className={clsx(
            'overflow-hidden rounded-b-md border border-t-0 shadow-sm',
            'border-gray-200 bg-white',
            'dark:border-gray-700 dark:bg-gray-950'
          )}
        >
          {sorted.map((entry) => {
            const translatedPreview = entry.segments.map((s) => s.translatedText).join(' ');

            return (
              <div
                key={entry.id}
                className={clsx(
                  'flex items-start border-t first:border-t-0',
                  'border-gray-100 dark:border-gray-800'
                )}
              >
                {/* Entry row — keyboard-accessible button for entry selection */}
                <button
                  type="button"
                  onClick={() => handleSelectEntry(entry.id)}
                  className={clsx(
                    'min-w-0 flex-1 cursor-pointer px-3 py-2 text-left transition-colors',
                    entry.selected
                      ? 'bg-violet-50 dark:bg-violet-950/30'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-900'
                  )}
                >
                  {/* Translation preview + date */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={clsx(
                        'truncate text-xs font-medium',
                        'text-gray-900',
                        'dark:text-gray-100'
                      )}
                    >
                      {translatedPreview}
                    </p>
                    <p
                      className={clsx('mt-0.5 text-[10px]', 'text-gray-500', 'dark:text-gray-400')}
                    >
                      {new Date(entry.createdAt).toLocaleString()}
                    </p>
                  </div>
                </button>

                {/* Delete trigger — outside the selection button to prevent click conflict */}
                <div className="flex-shrink-0 flex items-center px-2 py-2">
                  <ConfirmIconButton onConfirm={() => deleteEntry(parsedContent, entry.id)}>
                    <Trash2 className="w-3 h-3" />
                  </ConfirmIconButton>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
