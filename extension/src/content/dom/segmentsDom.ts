// dom/segmentsDom.ts — Extract, apply, and restore text segments from a live DOM element

import { nanoid } from 'nanoid';

import { getSegmentSelector, SEGMENT_ID_DATASET_KEY } from '../../constants/dom';
import type { TranslateSegment } from '../../types';
import { isInsideSkippedTagDom } from './textDom';

export interface TranslatedSegment extends TranslateSegment {
  translatedText: string;
}

/**
 * Walks the DOM, wraps each text node in a span with a segment id, and returns the segments.
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
    if (isInsideSkippedTagDom(node)) continue;
    textNodes.push(node);
  }

  return textNodes.map((n) => {
    const text = n.textContent ?? '';
    const id = nanoid(8);
    const span = document.createElement('span');
    span.dataset[SEGMENT_ID_DATASET_KEY] = id;
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
    const el = root.querySelector(getSegmentSelector(id));
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
    const el = root.querySelector(getSegmentSelector(id));
    if (el) el.textContent = text;
  });
};
