// Sidebar/index.tsx — Main sidebar shell with drawer and page display modes

import clsx from 'clsx';
import { AlignRight, Bot, Bug, Clock, Languages, PanelRight, Settings, X } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';

import { IconButton } from '../../../components/IconButton';
import { ThemeWrapper } from '../../../components/ThemeWrapper';
import ENV from '../../../constants/env';
import { SidebarModeEnum, SidebarTabEnum } from '../../../enums';
import { useGlobalStore } from '../../../store/global';
import { DevelopPanel } from '../ControlPanel/DevelopPanel';
import { ProviderPanel } from '../ControlPanel/ProviderPanel';
import { SettingsPanel } from '../ControlPanel/SettingsPanel';
import { HistoryTab } from './HistoryTab';
import { TabContent } from './TabContent';
import { Tabs } from './Tabs';

const TABS = [
  { id: SidebarTabEnum.History, label: 'History', icon: Clock },
  { id: SidebarTabEnum.General, label: 'General', icon: Settings },
  { id: SidebarTabEnum.Provider, label: 'Provider', icon: Bot },
  ...(ENV.isDev ? [{ id: SidebarTabEnum.Develop, label: 'Develop', icon: Bug }] : []),
];
// Also used for document.body.style.marginRight in page mode.
const SIDEBAR_WIDTH = 480;

export const Sidebar: React.FC = () => {
  const { settings, updateSettings } = useGlobalStore();
  const { showSidebar, sidebarMode } = settings;
  const [activeSidebarTab, setActiveSidebarTab] = useState(SidebarTabEnum.History);
  const [isMounted, setIsMounted] = useState(showSidebar);
  // Persisted across open/close cycles — stored here so HistoryTab unmount doesn't reset it
  const [openBlocks, setOpenBlocks] = useState<Record<string, boolean>>({});

  const handleSetBlock = useCallback((parsedContent: string, open: boolean) => {
    setOpenBlocks((prev) => ({ ...prev, [parsedContent]: open }));
  }, []);

  const isDrawerMode = sidebarMode === SidebarModeEnum.Drawer;

  useEffect(() => {
    if (showSidebar) {
      setIsMounted(true);
      return;
    }

    const timeout = window.setTimeout(() => setIsMounted(false), 200);
    return () => window.clearTimeout(timeout);
  }, [showSidebar]);

  // Push page content when NOT in drawer mode (i.e., page mode).
  // Back up the previous marginRight so cleanup restores it (not '')
  // in case GitHub or another script already set a value.
  useEffect(() => {
    if (!showSidebar || isDrawerMode) return;
    const prev = document.body.style.marginRight;
    document.body.style.marginRight = `${SIDEBAR_WIDTH}px`;
    return () => {
      document.body.style.marginRight = prev;
    };
  }, [showSidebar, isDrawerMode]);

  if (!isMounted) return null;

  const handleClose = () => updateSettings({ showSidebar: false });
  const handleModeToggle = () =>
    updateSettings({ sidebarMode: isDrawerMode ? SidebarModeEnum.Page : SidebarModeEnum.Drawer });

  return (
    <ThemeWrapper style={{ pointerEvents: 'auto' }}>
      <div
        className={clsx(
          'fixed top-0 right-0 h-dvh flex flex-col border-l shadow-xl',
          'transition-transform duration-200 ease-out will-change-transform',
          showSidebar ? 'translate-x-0' : 'translate-x-full',
          'bg-white border-gray-300',
          'dark:bg-gray-950 dark:border-gray-600'
        )}
        style={{ fontFamily: 'system-ui, sans-serif', width: SIDEBAR_WIDTH }}
      >
        {/* Header */}
        <div
          className={clsx(
            'flex items-center justify-between px-3 py-2.5 border-b flex-shrink-0',
            'border-gray-200',
            'dark:border-gray-700'
          )}
        >
          <div
            className={clsx(
              'flex items-center gap-1.5 text-sm font-semibold',
              'text-gray-800',
              'dark:text-gray-100'
            )}
          >
            <Languages className="w-4 h-4 text-blue-500" />
            Task Translator
          </div>

          <div className="flex items-center gap-1">
            <IconButton
              onClick={handleModeToggle}
              title={isDrawerMode ? 'Switch to page mode' : 'Switch to drawer mode'}
            >
              {isDrawerMode ? (
                <PanelRight className="w-4 h-4" />
              ) : (
                <AlignRight className="w-4 h-4" />
              )}
            </IconButton>

            <IconButton onClick={handleClose} title="Close sidebar">
              <X className="w-4 h-4" />
            </IconButton>
          </div>
        </div>

        {/* Tab bar */}
        <Tabs
          tabs={TABS}
          activeTab={activeSidebarTab}
          onChange={(id) => setActiveSidebarTab(id as SidebarTabEnum)}
        />

        {/* Tab content — scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {activeSidebarTab === SidebarTabEnum.History && (
            <TabContent padded={false}>
              <HistoryTab openBlocks={openBlocks} onSetBlock={handleSetBlock} />
            </TabContent>
          )}
          {activeSidebarTab === SidebarTabEnum.General && (
            <TabContent padded={false}>
              <SettingsPanel />
            </TabContent>
          )}
          {activeSidebarTab === SidebarTabEnum.Provider && (
            <TabContent>
              <ProviderPanel />
            </TabContent>
          )}
          {activeSidebarTab === SidebarTabEnum.Develop && ENV.isDev && (
            <TabContent>
              <DevelopPanel />
            </TabContent>
          )}
        </div>
      </div>
    </ThemeWrapper>
  );
};
