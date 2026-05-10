// Sidebar/Tabs.tsx — Generic raised tab bar used by the sidebar

import clsx from 'clsx';
import type React from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: React.FC<{ className?: string }>;
}

interface Props {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
}

export const Tabs: React.FC<Props> = ({ tabs, activeTab, onChange }) => (
  <div
    className={clsx(
      'relative flex flex-shrink-0 overflow-x-auto overflow-y-hidden px-2 pt-2',
      'after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-gray-200 after:content-[""]',
      'border-gray-200 bg-gray-50',
      'dark:border-gray-700 dark:bg-gray-900 dark:after:bg-gray-700'
    )}
  >
    {tabs.map((tab) => {
      const isActive = tab.id === activeTab;
      const Icon = tab.icon;
      return (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={clsx(
            'relative -mb-px flex items-center gap-1.5 rounded-t-md border border-b-0 px-2.5 py-1.5 text-xs font-semibold transition-colors',
            isActive
              ? 'z-10 border-gray-200 bg-white text-gray-900 shadow-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100'
              : 'border-transparent bg-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          )}
        >
          {Icon && <Icon className="h-3.5 w-3.5 flex-shrink-0" />}
          <span className="whitespace-nowrap">{tab.label}</span>
        </button>
      );
    })}
  </div>
);
