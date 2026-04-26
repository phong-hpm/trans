// Sidebar/BlockCollapse.tsx — Collapsible block entry showing translation history entries

import clsx from 'clsx';
import { Check, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import type React from 'react';

import { ConfirmIconButton } from '../../../components/IconButton';
import type { BlockHistory } from '../../../types';
import { deleteEntry, selectEntry } from '../../translationSync';

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
  const entryCount = history.entries.length;

  // Sort entries newest first
  const sorted = [...history.entries].sort((a, b) => b.createdAt - a.createdAt);

  const handleSelectEntry = (entryId: string) => {
    selectEntry(blockId, entryId);
  };

  return (
    <div ref={refCallback} className={clsx('border-b', 'border-gray-100', 'dark:border-gray-800')}>
      {/* Collapsed header */}
      <button
        type="button"
        onClick={onToggle}
        className={clsx(
          'w-full flex items-center gap-2 px-3 py-2 text-left transition-colors',
          'hover:bg-gray-50',
          'dark:hover:bg-gray-900'
        )}
      >
        <span className={clsx('flex-shrink-0', 'text-gray-400', 'dark:text-gray-500')}>
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </span>

        <span className={clsx('flex-1 text-xs truncate', 'text-gray-700', 'dark:text-gray-300')}>
          {preview}
        </span>

        <span
          className={clsx(
            'flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full',
            'bg-gray-100 text-gray-500',
            'dark:bg-gray-800 dark:text-gray-400'
          )}
        >
          {entryCount}
        </span>
      </button>

      {/* Expanded entry list */}
      {isOpen && (
        <div className={clsx('border-t', 'border-gray-100', 'dark:border-gray-800')}>
          {sorted.map((entry) => {
            const translatedPreview = entry.segments.map((s) => s.translatedText).join(' ');

            return (
              <div key={entry.id}>
                <div
                  onClick={() => handleSelectEntry(entry.id)}
                  className={clsx(
                    'flex items-start gap-2 px-3 py-2 cursor-pointer border-l-2 transition-colors',
                    entry.selected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                      : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-900'
                  )}
                >
                  {/* Selected checkmark */}
                  <span className="flex-shrink-0 w-3.5 h-3.5 mt-0.5">
                    {entry.selected && (
                      <Check
                        className={clsx('w-3.5 h-3.5', 'text-blue-500', 'dark:text-blue-400')}
                      />
                    )}
                  </span>

                  {/* Translation preview + date */}
                  <div className="flex-1 min-w-0">
                    <p className={clsx('text-xs truncate', 'text-gray-700', 'dark:text-gray-300')}>
                      {translatedPreview}
                    </p>
                    <p
                      className={clsx('text-[10px] mt-0.5', 'text-gray-400', 'dark:text-gray-500')}
                    >
                      {new Date(entry.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {/* Delete trigger — uses ConfirmIconButton for two-step confirm */}
                  <span className="flex-shrink-0 mt-0.5" onClick={(e) => e.stopPropagation()}>
                    <ConfirmIconButton onConfirm={() => deleteEntry(blockId, entry.id)}>
                      <Trash2 className="w-3 h-3" />
                    </ConfirmIconButton>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
