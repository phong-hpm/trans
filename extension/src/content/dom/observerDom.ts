// dom/observerDom.ts — MutationObserver utilities for watching DOM changes

/**
 * Observes direct children and subtree of document.body for structural changes.
 * Used in main.tsx to re-run block detection after page mutations (e.g. GitHub Turbo navigation).
 * Returns a cleanup function that disconnects the observer.
 */
export const observePageDom = (onMutation: () => void): (() => void) => {
  let debounce: ReturnType<typeof setTimeout>;

  const observer = new MutationObserver(() => {
    clearTimeout(debounce);
    debounce = setTimeout(onMutation, 400);
  });

  observer.observe(document.body, { childList: true, subtree: true });
  return () => observer.disconnect();
};

/**
 * Observes the parent of a content element for child list changes.
 * Used in useTranslate to detect when the framework re-renders and removes our spans.
 * Disconnects before the callback mutates DOM (prevents infinite loops), then reconnects.
 * Returns a cleanup function that disconnects the observer.
 */
export const observeBlockDom = (
  getElement: () => HTMLElement,
  onReplaced: (observer: MutationObserver) => void
): (() => void) => {
  const observer = new MutationObserver(() => onReplaced(observer));

  const el = getElement();
  observer.observe(el.parentElement ?? document.body, { childList: true, subtree: true });

  return () => observer.disconnect();
};
