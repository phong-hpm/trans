// ControlPanel/StoragePanel.tsx — Storage panel: usage bar + clear all history

import type React from 'react';
import { useEffect, useState } from 'react';

import { getStorageQuotaApi, getStorageUsageApi } from '../../../apis/storageApi';
import { ConfirmButton } from '../../../components/Button';
import { useHistoryStore } from '../../../store/history';

const toMB = (bytes: number) => (bytes / (1024 * 1024)).toFixed(2);

export const StoragePanel: React.FC = () => {
  const clearAll = useHistoryStore((s) => s.clearAll);
  const [usedBytes, setUsedBytes] = useState(0);
  const [limitBytes, setLimitBytes] = useState(0);

  useEffect(() => {
    getStorageUsageApi().then(setUsedBytes);
    getStorageQuotaApi().then(setLimitBytes);
  }, []);

  const usedPct = Math.min((usedBytes / limitBytes) * 100, 100);

  return (
    <div className="space-y-3">
      <div>
        <div className="w-full h-1.5 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${usedPct}%` }}
          />
        </div>
        <div className="flex justify-end mt-1">
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            {toMB(usedBytes)} MB / {toMB(limitBytes)} MB
          </span>
        </div>
      </div>
      <ConfirmButton
        variant="contain"
        color="danger"
        size="md"
        fullWidth
        onConfirm={() => clearAll().then(() => getStorageUsageApi().then(setUsedBytes))}
        confirmMessage="This will permanently delete all saved translations across all pages."
      >
        Clear all history
      </ConfirmButton>
    </div>
  );
};
