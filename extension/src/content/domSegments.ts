// domSegments.ts — Extract, apply, and restore text segments from a live DOM element

import { nanoid } from 'nanoid';
import type { TranslateSegment } from '../types';

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

export const extractSegments = (root: HTMLElement): TranslateSegment[] => {
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

export const applyTranslation = (segments: TranslatedSegment[], root: HTMLElement): void => {
  segments.forEach(({ id, text, translatedText }) => {
    const el = root.querySelector(`[data-trans-id="${id}"]`);
    if (!el) return;
    el.setAttribute('data-original', text);
    el.textContent = translatedText;
  });
};

export const restoreOriginal = (segments: TranslatedSegment[], root: HTMLElement): void => {
  segments.forEach(({ id, text }) => {
    const el = root.querySelector(`[data-trans-id="${id}"]`);
    if (el) el.textContent = text;
  });
};

// Returns the original (pre-translation) text of an element, reading data-original if available
export const getSegmentText = (el: HTMLElement): string => {
  const spans = el.querySelectorAll<HTMLElement>('[data-trans-id]');
  if (spans.length) {
    return Array.from(spans)
      .map((s) => s.getAttribute('data-original') ?? s.textContent ?? '')
      .join(' ');
  }
  return extractSegments(el).map((s) => s.text).join(' ');
};
