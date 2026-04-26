// ControlPanelModal/index.tsx — Renders ControlPanel inside Modal; reads state from global store

import type React from 'react';

import { Modal } from '../../../components/Modal';
import { useGlobalStore } from '../../../store/global';
import { ControlPanel } from '../ControlPanel';

export const ControlPanelModal: React.FC = () => {
  const { showModal, toggleModal, platformName } = useGlobalStore();

  const title = (
    <span className="flex items-center gap-2">
      Task Translator
      {!platformName && (
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
          Unsupported page
        </span>
      )}
    </span>
  );

  return (
    <Modal open={showModal} onClose={toggleModal} title={title} backdrop="blur">
      <ControlPanel pathname={location.pathname} />
    </Modal>
  );
};
