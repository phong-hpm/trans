// Sidebar/Tabs.tsx — Generic tab bar with bottom-border active indicator

import clsx from 'clsx';
import type React from 'react';

interface Tab {
  id: string;
  label: string;
}

interface Props {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
}

export const Tabs: React.FC<Props> = ({ tabs, activeTab, onChange }) => (
  <div
    className={clsx(
      'flex border-b flex-shrink-0',
      'border-gray-200',
      'dark:border-gray-700',
    )}
  >
    {tabs.map((tab) => {
      const isActive = tab.id === activeTab;
      return (
        <button
          key={tab.id}
          type='button'
          onClick={() => onChange(tab.id)}
          className={clsx(
            'px-4 py-2 text-xs font-medium border-b-2 -mb-px transition-colors',
            isActive
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
          )}
        >
          {tab.label}
        </button>
      );
    })}
  </div>
);
