// activeTranslations.ts — In-memory set tracking which blocks are currently showing translation
// Persists within the page session; cleared on navigation via useHistoryStore.init()

const active = new Set<string>();

/** Mark a block as currently showing its translation */
export const markActive = (parsedContent: string): void => {
  active.add(parsedContent);
};

/** Mark a block as no longer showing translation (restored to original) */
export const markInactive = (parsedContent: string): void => {
  active.delete(parsedContent);
};

/** Returns true if the block was showing translation before a potential re-render */
export const isActive = (parsedContent: string): boolean => active.has(parsedContent);

/** Clear all active entries — call on page navigation */
export const clearActiveTranslations = (): void => {
  active.clear();
};
