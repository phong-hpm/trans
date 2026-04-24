// useTheme.ts — Reads theme from chrome.storage.sync and reacts to popup changes

import { useEffect, useState } from 'react';
import type { Theme } from '../../types';

export const useTheme = (): Theme => {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    chrome.storage.sync.get({ theme: 'light' }, (items) => {
      setTheme(items.theme as Theme);
    });

    const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if ('theme' in changes) setTheme(changes.theme.newValue as Theme);
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  return theme;
};
