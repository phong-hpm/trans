// useTranslateRuntimeEvents.ts — Handles document-level translate and settings events for a block

import type { MutableRefObject } from 'react';
import { useEffect } from 'react';

import { TranslateStateEnum } from '../../enums';
import { useHistoryStore } from '../../store/history';

interface Params {
  parsedContent: string;
  stateRef: MutableRefObject<TranslateStateEnum>;
  translateRef: MutableRefObject<() => Promise<void>>;
  restoreRef: MutableRefObject<() => void>;
}

export const useTranslateRuntimeEvents = ({
  parsedContent,
  stateRef,
  translateRef,
  restoreRef,
}: Params): void => {
  const { getBlockHistory } = useHistoryStore();
  useEffect(() => {
    const handler = async () => {
      if (stateRef.current === TranslateStateEnum.Loading) {
        document.dispatchEvent(new CustomEvent('trans:translate-done'));
        return;
      }

      try {
        await translateRef.current();
      } finally {
        document.dispatchEvent(new CustomEvent('trans:translate-done'));
      }
    };

    document.addEventListener('trans:translate-all', handler);
    return () => document.removeEventListener('trans:translate-all', handler);
  }, [stateRef, translateRef]);

  useEffect(() => {
    const handler = (e: Event) => {
      const {
        alwaysShowTranslated,
        prevAlwaysShowTranslated,
        autoTranslateTask,
        prevAutoTranslateTask,
      } = (
        e as CustomEvent<{
          alwaysShowTranslated: boolean;
          prevAlwaysShowTranslated: boolean;
          autoTranslateTask: boolean;
          prevAutoTranslateTask: boolean;
        }>
      ).detail;

      if (alwaysShowTranslated !== prevAlwaysShowTranslated) {
        if (alwaysShowTranslated && stateRef.current === TranslateStateEnum.Idle) {
          const hist = getBlockHistory(parsedContent);
          if (hist?.entries.length) translateRef.current();
        } else if (
          !alwaysShowTranslated &&
          !autoTranslateTask &&
          stateRef.current === TranslateStateEnum.Translated
        ) {
          restoreRef.current();
        }
      }

      if (autoTranslateTask !== prevAutoTranslateTask) {
        if (autoTranslateTask && stateRef.current === TranslateStateEnum.Idle) {
          translateRef.current();
        } else if (
          !autoTranslateTask &&
          !alwaysShowTranslated &&
          stateRef.current === TranslateStateEnum.Translated
        ) {
          restoreRef.current();
        }
      }
    };

    document.addEventListener('trans:settings-change', handler);
    return () => document.removeEventListener('trans:settings-change', handler);
  }, [parsedContent, stateRef, translateRef, restoreRef, getBlockHistory]);
};
