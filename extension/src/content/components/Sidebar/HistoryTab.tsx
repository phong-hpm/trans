// Sidebar/HistoryTab.tsx — History tab: lists all block translation histories for the current page

import clsx from 'clsx';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';

import { useGlobalStore } from '../../../store/global';
import { useBlockHistories } from '../../hooks/useBlockHistories';
import { BlockCollapse } from './BlockCollapse';

export const HistoryTab: React.FC = () => {
  const { focusedBlockId, clearFocusedBlock } = useGlobalStore();
  const histories = useBlockHistories();
  const [openBlocks, setOpenBlocks] = useState<Record<string, boolean>>({});
  const itemRefs = useRef<Record<string, HTMLElement | null>>({});

  // When focusedBlockId changes, open that block and scroll to it
  useEffect(() => {
    if (!focusedBlockId) return;
    setOpenBlocks((prev) => ({ ...prev, [focusedBlockId]: true }));
    requestAnimationFrame(() => {
      itemRefs.current[focusedBlockId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      clearFocusedBlock();
    });
  }, [focusedBlockId, clearFocusedBlock]);

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
          key={item.blockId}
          blockId={item.blockId}
          history={item.history}
          preview={item.preview}
          isOpen={!!openBlocks[item.blockId]}
          onToggle={() =>
            setOpenBlocks((prev) => ({ ...prev, [item.blockId]: !prev[item.blockId] }))
          }
          refCallback={(el) => {
            itemRefs.current[item.blockId] = el;
          }}
        />
      ))}
    </div>
  );
};
