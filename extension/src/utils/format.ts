// utils/format.ts — Shared formatting helpers

/**
 * Converts bytes to a human-readable megabyte string (2 decimal places).
 */
export const toMB = (bytes: number): string => (bytes / (1024 * 1024)).toFixed(2);
