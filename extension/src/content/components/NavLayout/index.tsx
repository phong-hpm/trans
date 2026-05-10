// NavLayout/index.tsx — Reusable top-tab + content area layout; active state managed by parent

import clsx from 'clsx';
import type React from 'react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.FC<{ className?: string }>;
}

interface Props {
  items: NavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  children: React.ReactNode;
}

export const NavLayout: React.FC<Props> = ({ items, activeId, onSelect, children }) => (
  <div className="flex min-h-full flex-col">
    <nav
      className={clsx(
        'flex flex-shrink-0 overflow-x-auto border-b px-3',
        'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900'
      )}
    >
      {items.map(({ id, label, icon: Icon }) => {
        const isActive = id === activeId;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className={clsx(
              'flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors',
              isActive
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            )}
          >
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="whitespace-nowrap">{label}</span>
          </button>
        );
      })}
    </nav>

    <div className="flex-1 p-4">{children}</div>
  </div>
);
