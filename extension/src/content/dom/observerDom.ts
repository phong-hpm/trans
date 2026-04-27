// dom/observerDom.ts — MutationObserver utilities for watching DOM changes

/**
 * Observes direct children and subtree of document.body for structural changes.
 * Ignores mutations that only affect our own translation attributes (data-trans-*).
 * Used in main.tsx to re-run block detection after page mutations (e.g. GitHub Turbo navigation).
 * Returns a cleanup function that disconnects the observer.
 */
export const observePageDom = (onMutation: () => void): (() => void) => {
  let debounce: ReturnType<typeof setTimeout>;

  const observer = new MutationObserver((mutations) => {
    // Skip mutations that only affect our own translation attributes — they don't change page structure
    const isOwnMutation = mutations.every(
      (m) =>
        m.type === 'attributes' &&
        typeof m.attributeName === 'string' &&
        m.attributeName.startsWith('data-trans-')
    );
    if (isOwnMutation) return;

    clearTimeout(debounce);
    debounce = setTimeout(onMutation, 200);
  });

  observer.observe(document.body, { childList: true, subtree: true, attributes: true });
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
