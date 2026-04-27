// ControlPanel/index.tsx — Main control panel: nav + panels; accepts pathname for portability

import { Bot, Bug, FileText, HardDrive, Settings } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';

import ENV from '../../../constants/env';
import { NavLayout } from '../NavLayout';
import { DevelopPanel } from './DevelopPanel';
import { PagePanel } from './PagePanel';
import { ProviderPanel } from './ProviderPanel';
import { SettingsPanel } from './SettingsPanel';
import { StoragePanel } from './StoragePanel';

type NavId = 'settings' | 'provider' | 'page' | 'storage' | 'develop';

const NAV_ITEMS = [
  { id: 'settings' as NavId, label: 'Settings', icon: Settings },
  { id: 'provider' as NavId, label: 'Provider', icon: Bot },
  { id: 'page' as NavId, label: 'Page', icon: FileText },
  { id: 'storage' as NavId, label: 'Storage', icon: HardDrive },
  ...(ENV.isDev ? [{ id: 'develop' as NavId, label: 'Develop', icon: Bug }] : []),
];

interface Props {
  pathname: string;
}

export const ControlPanel: React.FC<Props> = ({ pathname }) => {
  const [activeId, setActiveId] = useState<NavId>(ENV.isDev ? 'develop' : 'settings');

  return (
    <NavLayout items={NAV_ITEMS} activeId={activeId} onSelect={(id) => setActiveId(id as NavId)}>
      {activeId === 'settings' && <SettingsPanel />}
      {activeId === 'provider' && <ProviderPanel />}
      {activeId === 'page' && <PagePanel pathname={pathname} />}
      {activeId === 'storage' && <StoragePanel />}
      {activeId === 'develop' && <DevelopPanel />}
    </NavLayout>
  );
};
