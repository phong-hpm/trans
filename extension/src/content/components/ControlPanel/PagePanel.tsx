// ControlPanel/PagePanel.tsx — Page panel: platform info + saved translation count + clear

import clsx from 'clsx';
import type React from 'react';
import { useEffect, useState } from 'react';

import { clearPageHistoriesApi, getAllHistoriesApi } from '../../../apis/historyApi';
import { ConfirmButton } from '../../../components/Button';
import { useGlobalStore } from '../../../store/global';

interface Props {
  pathname: string;
}

export const PagePanel: React.FC<Props> = ({ pathname }) => {
  const { platformName } = useGlobalStore();
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    if (!platformName) return;
    getAllHistoriesApi(pathname).then((h) => setPageCount(h.length));
  }, [pathname, platformName]);

  if (!platformName) {
    return (
      <div
        className={clsx(
          'rounded-lg border px-3 py-3 text-xs space-y-1',
          'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30'
        )}
      >
        <p className="font-semibold text-amber-700 dark:text-amber-400">Page not supported</p>
        <p className="text-amber-600 dark:text-amber-500">
          Translation is only available on supported platforms (e.g. GitHub Issues).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Platform badge + pathname */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={clsx(
            'inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full',
            'bg-blue-50 text-blue-600 border border-blue-200',
            'dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800'
          )}
        >
          {platformName}
        </span>
        <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{pathname}</span>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Saved translations:{' '}
        <span className="font-semibold text-gray-800 dark:text-gray-100">{pageCount}</span>
      </p>

      {pageCount > 0 ? (
        <ConfirmButton
          variant="contain"
          color="danger"
          size="md"
          fullWidth
          onConfirm={() => clearPageHistoriesApi(pathname).then(() => setPageCount(0))}
          confirmMessage="This will remove all saved translations for this page."
        >
          Clear page history
        </ConfirmButton>
      ) : (
        <p className="text-xs text-gray-400 dark:text-gray-500 italic">No saved translations.</p>
      )}
    </div>
  );
};
