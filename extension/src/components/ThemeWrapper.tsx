// ThemeWrapper.tsx — Wraps children with the current theme class for dark mode support

import clsx from 'clsx';
import type React from 'react';

import { ThemeEnum } from '../enums';
import { useGlobalStore } from '../store/global';

interface Props {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const ThemeWrapper: React.FC<Props> = ({ children, className, style }) => {
  const { settings } = useGlobalStore();
  const themeClass = settings.theme === ThemeEnum.Dark ? 'dark' : '';
  const colorScheme = settings.theme === ThemeEnum.Dark ? 'dark' : 'light';
  return (
    <div className={clsx(themeClass, className)} style={{ colorScheme, ...style }}>
      {children}
    </div>
  );
};
