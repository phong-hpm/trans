// utils/url.ts — URL normalization utilities for storage key stability

/**
 * Normalizes a URL to origin + pathname only (strips query string and hash).
 * Used as the stable storage key for page-level history grouping.
 */
export const normalizePageUrl = (url: string): string => {
  try {
    const u = new URL(url);
    return u.origin + u.pathname;
  } catch {
    return url;
  }
};
