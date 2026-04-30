// Sidebar/HistoryTab.tsx — History tab: lists all block translation histories for the current page

import clsx from 'clsx';
import type React from 'react';
import { useEffect, useRef } from 'react';

import { useGlobalStore } from '../../../store/global';
import { useBlockHistories } from '../../hooks/useBlockHistories';
import { BlockCollapse } from './BlockCollapse';

interface Props {
  /** Persisted open/closed state — passed from Sidebar so it survives close/reopen cycles */
  openBlocks: Record<string, boolean>;
  /** Set a specific block open or closed */
  onSetBlock: (parsedContent: string, open: boolean) => void;
}

export const HistoryTab: React.FC<Props> = ({ openBlocks, onSetBlock }) => {
  const { focusedParsedContent, clearFocusedBlock } = useGlobalStore();
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

  if (!histories.length) {
    return (
      <div
        className={clsx(
          'flex flex-col items-center justify-center h-full py-12 px-4 text-center',
          'text-gray-400',
          'dark:text-gray-500'
        )}
      >
        <p className="text-sm">No translations yet.</p>
        <p className="text-xs mt-1">Translate a block to see its history here.</p>
      </div>
    );
  }

  return (
    <div className="py-1">
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
  );
};
