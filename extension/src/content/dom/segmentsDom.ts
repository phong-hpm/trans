// dom/segmentsDom.ts — Extract, apply, and restore text segments from a live DOM element

import { nanoid } from 'nanoid';

import type { TranslateSegment } from '../../types';

export interface TranslatedSegment extends TranslateSegment {
  translatedText: string;
}

const SKIP_TAGS = new Set(['CODE', 'PRE', 'SCRIPT', 'STYLE', 'KBD', 'VAR', 'SAMP']);

const isInsideSkippedTag = (node: Node): boolean => {
  let el = node.parentElement;
  while (el) {
    if (SKIP_TAGS.has(el.tagName)) return true;
    el = el.parentElement;
  }
  return false;
};

/**
 * Walks the DOM, wraps each text node in a span with data-trans-id, and returns the segments.
 * Skips nodes inside code/pre/script/style tags.
 */
export const extractSegmentsDom = (root: HTMLElement): TranslateSegment[] => {
  // Collect all text nodes first — modifying DOM inside a TreeWalker loop breaks traversal
  const textNodes: Node[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

  let node: Node | null;
  while ((node = walker.nextNode())) {
    const text = node.textContent ?? '';
    if (!text.trim()) continue;
    if (isInsideSkippedTag(node)) continue;
    textNodes.push(node);
  }

  return textNodes.map((n) => {
    const text = n.textContent ?? '';
    const id = nanoid(8);
    const span = document.createElement('span');
    span.setAttribute('data-trans-id', id);
    span.textContent = text;
    n.parentNode!.replaceChild(span, n);
    return { id, text };
  });
};

/**
 * Writes translated text into each segment span. Stores the original in data-original.
 */
export const applyTranslationDom = (segments: TranslatedSegment[], root: HTMLElement): void => {
  segments.forEach(({ id, text, translatedText }) => {
    const el = root.querySelector(`[data-trans-id="${id}"]`);
    if (!el) return;
    el.setAttribute('data-original', text);
    el.textContent = translatedText;
  });
};

/**
 * Restores the original text in each segment span.
 */
export const restoreOriginalDom = (segments: TranslatedSegment[], root: HTMLElement): void => {
  segments.forEach(({ id, text }) => {
    const el = root.querySelector(`[data-trans-id="${id}"]`);
    if (el) el.textContent = text;
  });
};

/**
 * Reads all visible text from an element without mutating the DOM.
 * Used for context building — does not wrap text nodes in spans.
 */
const readTextDom = (root: HTMLElement): string => {
  const parts: string[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const text = node.textContent?.trim();
    if (text && !isInsideSkippedTag(node)) parts.push(text);
  }
  return parts.join(' ');
};

/**
 * Returns the ORIGINAL (pre-translation) text of an element — safe to use for context building.
 *
 * Three cases:
 * 1. Translated (spans + data-original present)  → reads data-original (original text) ✓
 * 2. Extracted not yet applied (spans, no data-original) → falls back to textContent (still original) ✓
 * 3. Never extracted (no spans)                  → readTextDom (read-only TreeWalker) ✓
 *
 * Never returns translated text, never mutates the DOM.
 */
export const getSegmentTextDom = (el: HTMLElement): string => {
  const spans = el.querySelectorAll<HTMLElement>('[data-trans-id]');
  if (spans.length) {
    // data-original is set by applyTranslationDom; falls back to textContent (original) if not yet applied
    return Array.from(spans)
      .map((s) => s.getAttribute('data-original') ?? s.textContent ?? '')
      .join(' ');
  }
  return readTextDom(el);
};
