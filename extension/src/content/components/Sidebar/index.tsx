// Sidebar/index.tsx — Main sidebar shell with drawer and page display modes

import clsx from 'clsx';
import { AlignRight, PanelRight, X } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { IconButton } from '../../../components/IconButton';
import { useGlobalStore } from '../../../store/global';
import { SidebarModeEnum, SidebarTabEnum } from '../../../types';
import { HistoryTab } from './HistoryTab';
import { Tabs } from './Tabs';

const TABS = [{ id: SidebarTabEnum.History, label: 'History' }];

const ICON_URL = chrome.runtime.getURL('icons/icon32.png');

export const Sidebar: React.FC = () => {
  const { theme, showSidebar, sidebarMode, patchSettings } = useGlobalStore();
  const [activeTab, setActiveTab] = useState<string>(SidebarTabEnum.History);

  const isPage = sidebarMode === SidebarModeEnum.Page;

  // Push page content when in page mode
  useEffect(() => {
    if (!showSidebar || !isPage) return;
    document.body.style.marginRight = '320px';
    return () => {
      document.body.style.marginRight = '';
    };
  }, [showSidebar, isPage]);

  if (!showSidebar) return null;

  const handleClose = () => patchSettings({ showSidebar: false });
  const handleModeToggle = () =>
    patchSettings({ sidebarMode: isPage ? SidebarModeEnum.Drawer : SidebarModeEnum.Page });

  return (
    <div className={theme.themeClass} style={{ pointerEvents: 'auto' }}>
      <div
        className={clsx(
          'fixed top-0 right-0 h-dvh w-80 flex flex-col border-l shadow-xl',
          'bg-white border-gray-300',
          'dark:bg-gray-950 dark:border-gray-600',
        )}
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        {/* Header */}
        <div
          className={clsx(
            'flex items-center justify-between px-3 py-2.5 border-b flex-shrink-0',
            'border-gray-200',
            'dark:border-gray-700',
          )}
        >
          <div
            className={clsx(
              'flex items-center gap-1.5 text-sm font-semibold',
              'text-gray-800',
              'dark:text-gray-100',
            )}
          >
            <img src={ICON_URL} alt='Task Translator' className='w-4 h-4' />
            Task Translator
          </div>

          <div className='flex items-center gap-1'>
            <IconButton
              onClick={handleModeToggle}
              title={isPage ? 'Switch to drawer mode' : 'Switch to page mode'}
            >
              {isPage ? <AlignRight className='w-4 h-4' /> : <PanelRight className='w-4 h-4' />}
            </IconButton>

            <IconButton onClick={handleClose} title='Close sidebar'>
              <X className='w-4 h-4' />
            </IconButton>
          </div>
        </div>

        {/* Tab bar */}
        <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

        {/* Tab content — scrollable */}
        <div className='flex-1 overflow-y-auto'>
          {activeTab === SidebarTabEnum.History && <HistoryTab />}
        </div>
      </div>
    </div>
  );
};
