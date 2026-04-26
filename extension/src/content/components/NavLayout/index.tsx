// NavLayout/index.tsx — Reusable left-navbar + content area layout; active state managed by parent

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
  <div className="flex flex-1 min-h-0">
    {/* Left navbar */}
    <nav
      className={clsx(
        'flex flex-col flex-shrink-0 w-32 py-2',
        'border-r border-gray-200 dark:border-gray-700',
        'bg-gray-50 dark:bg-gray-900'
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
              'flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-left transition-colors',
              'border-l-2',
              isActive
                ? 'border-blue-500 text-blue-600 bg-white dark:bg-gray-950 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800'
            )}
          >
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            {label}
          </button>
        );
      })}
    </nav>

    {/* Panel content */}
    <div className="flex-1 overflow-y-auto p-4">{children}</div>
  </div>
);
