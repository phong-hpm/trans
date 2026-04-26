// storageApi.ts — Storage metadata queries (usage and quota)

export const getStorageUsageApi = (): Promise<number> =>
  new Promise((resolve) => {
    chrome.storage.local.getBytesInUse(null, resolve);
  });

export const getStorageQuotaApi = (): Promise<number> =>
  Promise.resolve(chrome.storage.local.QUOTA_BYTES);
