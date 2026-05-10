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
        'relative flex flex-shrink-0 overflow-x-auto px-3 pt-3',
        'after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-gray-200 after:content-[""]',
        'bg-gray-50 dark:bg-gray-900 dark:after:bg-gray-700'
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
              'relative -mb-px flex items-center gap-1.5 rounded-t-md border border-b-0 px-2.5 py-1.5 text-xs font-semibold transition-colors',
              isActive
                ? 'z-10 border-gray-200 bg-white text-gray-900 shadow-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100'
                : 'border-transparent bg-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            )}
          >
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="whitespace-nowrap">{label}</span>
          </button>
        );
      })}
    </nav>

    <div className="flex-1 bg-gray-50 p-4 dark:bg-gray-900">{children}</div>
  </div>
);
