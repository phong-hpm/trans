// useTargetElements.ts — Returns the current connected DOM elements targeted by a block toolbar

import { useCallback } from 'react';

import type { PlatformBlock } from '../../platforms/types';
import { TranslatableBlock } from '../block/TranslatableBlock';

export const useTargetElements = (platformBlock: PlatformBlock): (() => HTMLElement[]) =>
  useCallback((): HTMLElement[] => {
    const elements = new TranslatableBlock(platformBlock).elements;
    return elements.filter((el, index) => el.isConnected && elements.indexOf(el) === index);
  }, [platformBlock]);
