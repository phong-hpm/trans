// Sidebar/BlockCollapse.tsx — Collapsible block entry showing translation history entries

import clsx from 'clsx';
import { Check, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Confirm } from '../../../components/Confirm';
import type { BlockHistory } from '../../../types';
import { deleteEntry, selectEntry } from '../../translationCache';

interface Props {
  blockId: string;
  history: BlockHistory;
  preview: string;
  isOpen: boolean;
  onToggle: () => void;
  refCallback: (el: HTMLElement | null) => void;
}

export const BlockCollapse: React.FC<Props> = ({
  blockId,
  history,
  preview,
  isOpen,
  onToggle,
  refCallback,
}) => {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const entryCount = history.entries.length;

  // Sort entries newest first
  const sorted = [...history.entries].sort((a, b) => b.createdAt - a.createdAt);

  const handleSelectEntry = (entryId: string) => {
    if (pendingDeleteId) return;
    selectEntry(blockId, entryId);
  };

  const handleConfirmDelete = () => {
    if (!pendingDeleteId) return;
    deleteEntry(blockId, pendingDeleteId);
    setPendingDeleteId(null);
  };

  return (
    <div
      ref={refCallback}
      className={clsx(
        'border-b',
        'border-gray-100',
        'dark:border-gray-800',
      )}
    >
      {/* Collapsed header */}
      <button
        type='button'
        onClick={onToggle}
        className={clsx(
          'w-full flex items-center gap-2 px-3 py-2 text-left transition-colors',
          'hover:bg-gray-50',
          'dark:hover:bg-gray-900',
        )}
      >
        <span
          className={clsx(
            'flex-shrink-0',
            'text-gray-400',
            'dark:text-gray-500',
          )}
        >
          {isOpen ? <ChevronDown className='w-3.5 h-3.5' /> : <ChevronRight className='w-3.5 h-3.5' />}
        </span>

        <span
          className={clsx(
            'flex-1 text-xs truncate',
            'text-gray-700',
            'dark:text-gray-300',
          )}
        >
          {preview}
        </span>

        <span
          className={clsx(
            'flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full',
            'bg-gray-100 text-gray-500',
            'dark:bg-gray-800 dark:text-gray-400',
          )}
        >
          {entryCount}
        </span>
      </button>

      {/* Expanded entry list */}
      {isOpen && (
        <div
          className={clsx(
            'border-t',
            'border-gray-100',
            'dark:border-gray-800',
          )}
        >
          {sorted.map((entry) => {
            const translatedPreview = entry.segments.map((s) => s.translatedText).join(' ');
            const isPendingDelete = pendingDeleteId === entry.id;

            return (
              <div key={entry.id}>
                <div
                  onClick={() => handleSelectEntry(entry.id)}
                  className={clsx(
                    'flex items-start gap-2 px-3 py-2 cursor-pointer border-l-2 transition-colors',
                    entry.selected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                      : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-900',
                    isPendingDelete && 'opacity-50 pointer-events-none',
                  )}
                >
                  {/* Selected checkmark */}
                  <span className='flex-shrink-0 w-3.5 h-3.5 mt-0.5'>
                    {entry.selected && (
                      <Check
                        className={clsx(
                          'w-3.5 h-3.5',
                          'text-blue-500',
                          'dark:text-blue-400',
                        )}
                      />
                    )}
                  </span>

                  {/* Translation preview + date */}
                  <div className='flex-1 min-w-0'>
                    <p
                      className={clsx(
                        'text-xs truncate',
                        'text-gray-700',
                        'dark:text-gray-300',
                      )}
                    >
                      {translatedPreview}
                    </p>
                    <p
                      className={clsx(
                        'text-[10px] mt-0.5',
                        'text-gray-400',
                        'dark:text-gray-500',
                      )}
                    >
                      {new Date(entry.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {/* Delete trigger button */}
                  <button
                    type='button'
                    onClick={(e) => {
                      e.stopPropagation();
                      setPendingDeleteId(entry.id);
                    }}
                    title='Delete this translation'
                    className={clsx(
                      'flex-shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors mt-0.5',
                      'text-gray-300 hover:text-red-500 hover:bg-red-50',
                      'dark:text-gray-600 dark:hover:text-red-400 dark:hover:bg-red-950/30',
                    )}
                  >
                    <Trash2 className='w-3 h-3' />
                  </button>
                </div>

                {/* Inline confirm row — shown directly below the entry */}
                {isPendingDelete && (
                  <div className='px-3 pb-2'>
                    <Confirm
                      onConfirm={handleConfirmDelete}
                      onCancel={() => setPendingDeleteId(null)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
