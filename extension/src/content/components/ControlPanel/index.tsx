// ControlPanel/index.tsx — Main control panel: nav + panels; accepts pathname for portability

import { FileText, HardDrive, Settings } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';

import { NavLayout } from '../NavLayout';
import { PagePanel } from './PagePanel';
import { SettingsPanel } from './SettingsPanel';
import { StoragePanel } from './StoragePanel';

type NavId = 'settings' | 'page' | 'storage';

const NAV_ITEMS = [
  { id: 'settings' as NavId, label: 'Settings', icon: Settings },
  { id: 'page' as NavId, label: 'Page', icon: FileText },
  { id: 'storage' as NavId, label: 'Storage', icon: HardDrive },
];

interface Props {
  pathname: string;
}

export const ControlPanel: React.FC<Props> = ({ pathname }) => {
  const [activeId, setActiveId] = useState<NavId>('settings');

  return (
    <NavLayout items={NAV_ITEMS} activeId={activeId} onSelect={(id) => setActiveId(id as NavId)}>
      {activeId === 'settings' && <SettingsPanel />}
      {activeId === 'page' && <PagePanel pathname={pathname} />}
      {activeId === 'storage' && <StoragePanel />}
    </NavLayout>
  );
};
