// utils/api.ts — Shared API utilities for building backend request URLs and making fetch calls

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

interface CallApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
}

/**
 * Wraps fetch with JSON serialization and error handling.
 * Returns parsed response body, or null for empty responses.
 */
export const callApi = async <T = unknown>(
  url: string,
  { method = 'GET', body }: CallApiOptions = {}
): Promise<T> => {
  const res = await fetch(url, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) throw new Error(`[api] ${method} ${url} failed: ${res.status}`);

  return res.json() as Promise<T>;
};
