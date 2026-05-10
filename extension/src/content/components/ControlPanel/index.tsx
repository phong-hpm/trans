// ControlPanel/index.tsx — Main control panel: nav + panels; accepts pathname for portability

import { Bot, Bug, HardDrive, Settings } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';

import ENV from '../../../constants/env';
import { NavLayout } from '../NavLayout';
import { DevelopPanel } from './DevelopPanel';
import { ProviderPanel } from './ProviderPanel';
import { SettingsPanel } from './SettingsPanel';
import { StoragePanel } from './StoragePanel';

type NavId = 'settings' | 'provider' | 'storage' | 'develop';

const NAV_ITEMS = [
  { id: 'settings' as NavId, label: 'General', icon: Settings },
  { id: 'provider' as NavId, label: 'Provider', icon: Bot },
  { id: 'storage' as NavId, label: 'Storage', icon: HardDrive },
  ...(ENV.isDev ? [{ id: 'develop' as NavId, label: 'Develop', icon: Bug }] : []),
];

export const ControlPanel: React.FC = () => {
  const [activeId, setActiveId] = useState<NavId>(ENV.isDev ? 'develop' : 'settings');

  return (
    <NavLayout items={NAV_ITEMS} activeId={activeId} onSelect={(id) => setActiveId(id as NavId)}>
      {activeId === 'settings' && <SettingsPanel />}
      {activeId === 'provider' && <ProviderPanel />}
      {activeId === 'storage' && <StoragePanel />}
      {activeId === 'develop' && <DevelopPanel />}
    </NavLayout>
  );
};
