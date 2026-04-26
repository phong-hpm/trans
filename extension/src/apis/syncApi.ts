// syncApi.ts — Abstraction over chrome.storage.sync; swap implementation here if storage backend changes

export const getSettingsApi = <T extends object>(defaults: T): Promise<T> =>
  new Promise((resolve) => {
    chrome.storage.sync.get(defaults, (items) => resolve(items as T));
  });

export const saveSettingsApi = (patch: object): void => {
  chrome.storage.sync.set(patch);
};

export const subscribeSettingsChangesApi = (
  listener: (changes: Record<string, chrome.storage.StorageChange>) => void
): (() => void) => {
  const handler = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area === 'sync') listener(changes);
  };
  chrome.storage.onChanged.addListener(handler);
  return () => chrome.storage.onChanged.removeListener(handler);
};
