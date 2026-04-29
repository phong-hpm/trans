// dom/observerDom.ts — MutationObserver utilities for watching DOM changes

/**
 * Observes document.body subtree for structural (childList) changes.
 * Does NOT observe attribute changes — applyTranslationDom sets data-original which would
 * create a feedback loop if attributes were observed.
 * Returns a cleanup function that disconnects the observer.
 */
export const observePageDom = (onMutation: () => void): (() => void) => {
  let debounce: ReturnType<typeof setTimeout>;

  const observer = new MutationObserver(() => {
    clearTimeout(debounce);
    debounce = setTimeout(onMutation, 200);
  });

  observer.observe(document.body, { childList: true, subtree: true });
  return () => observer.disconnect();
};

/**
 * Observes a stable container element for descendant structural changes.
 * containerEl should be the outermost stable ancestor of the content element
 * (e.g. the comment wrapper, not the markdown-body inside it).
 * Watching the stable container ensures the observer survives inner element replacements.
 * Returns a cleanup function that disconnects the observer.
 */
export const observeBlockDom = (
  containerEl: HTMLElement,
  onChanged: (observer: MutationObserver) => void
): (() => void) => {
  const observer = new MutationObserver(() => onChanged(observer));
  observer.observe(containerEl, { childList: true, subtree: true });
  return () => observer.disconnect();
};
