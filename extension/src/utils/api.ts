// utils/api.ts — Shared API utilities for building backend request URLs

import ENV from '../constants/env';

export const buildUrlApi = (
  path: string,
  params?: Record<string, string | number | boolean>
): string => {
  const url = new URL(`${ENV.backendUrl}/${path}`);

  if (params) {
    url.search = new URLSearchParams(
      Object.entries(params).map(([key, value]) => [key, String(value)])
    ).toString();
  }

  return url.toString();
};
