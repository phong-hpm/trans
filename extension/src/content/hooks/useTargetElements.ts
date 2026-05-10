// useTargetElements.ts — Returns the current connected DOM elements targeted by a block toolbar

import { useCallback } from 'react';

import type { BlockTranslationTarget } from '../../platforms/types';

export const useTargetElements = (blockTarget: BlockTranslationTarget): (() => HTMLElement[]) =>
  useCallback((): HTMLElement[] => {
    const elements = blockTarget.domAccess.getElements();
    return elements.filter((el, index) => el.isConnected && elements.indexOf(el) === index);
  }, [blockTarget]);
