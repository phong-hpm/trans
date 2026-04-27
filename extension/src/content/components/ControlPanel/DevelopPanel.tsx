// ControlPanel/DevelopPanel.tsx — Dev-only panel: debugging tools and store inspection

import { ChevronDown, ChevronRight, Copy, Terminal } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';

import { Button } from '../../../components/Button';
import { IconButton } from '../../../components/IconButton';
import { useGlobalStore } from '../../../store/global';
import { useHistoryStore } from '../../../store/history';

// Strips function values from a store object before display / copy / log
const filterStore = (data: object): object =>
  Object.fromEntries(Object.entries(data).filter(([, v]) => typeof v !== 'function'));

interface StoreInspectorProps {
  label: string;
  data: object;
}

const StoreInspector: React.FC<StoreInspectorProps> = ({ label, data }) => {
  const [open, setOpen] = useState(false);
  const filtered = filterStore(data);
  const json = JSON.stringify(filtered, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(json).catch(() => {});
  };

  const handleLog = () => {
    console.group(`[${label}]`);
    console.log(filtered);
    console.groupEnd();
  };

  return (
    <div className="rounded border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-2 py-1.5 cursor-pointer bg-gray-50 dark:bg-gray-900 select-none"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-200">
          {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          {label}
        </div>
        {open && (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <IconButton size="sm" title="Copy" onClick={handleCopy}>
              <Copy size={11} />
            </IconButton>
            <IconButton size="sm" title="Log" onClick={handleLog}>
              <Terminal size={11} />
            </IconButton>
          </div>
        )}
      </div>

      {/* Body */}
      {open && (
        <pre className="text-[10px] leading-relaxed px-2 py-2 overflow-auto max-h-48 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-950">
          {json}
        </pre>
      )}
    </div>
  );
};

export const DevelopPanel: React.FC = () => {
  const globalStore = useGlobalStore();
  const historyStore = useHistoryStore();

  const handleLogGlobalStore = () => {
    console.group('[GlobalStore]');
    console.log(filterStore(globalStore));
    console.groupEnd();
  };

  const handleLogPageHistory = () => {
    console.group('[HistoryStore] page history');
    console.log(historyStore.histories);
    console.groupEnd();
  };

  return (
    <div className="space-y-4">
      {/* Store Inspectors */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Stores</div>
        <StoreInspector label="Global Store" data={globalStore} />
        <StoreInspector label="History Store" data={historyStore} />
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Actions</div>
        <Button variant="outline" color="ghost" onClick={handleLogGlobalStore}>
          Log Global Store
        </Button>
        <Button variant="outline" color="ghost" onClick={handleLogPageHistory}>
          Log page history
        </Button>
      </div>
    </div>
  );
};
