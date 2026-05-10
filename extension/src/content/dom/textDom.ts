// dom/textDom.ts — Read text from host-page DOM without mutating it

import { SEGMENT_SELECTOR } from '../../constants/dom';

const SKIP_TAGS = new Set(['CODE', 'PRE', 'SCRIPT', 'STYLE', 'KBD', 'VAR', 'SAMP']);

export const isInsideSkippedTagDom = (node: Node): boolean => {
  let el = node.parentElement;
  while (el) {
    if (SKIP_TAGS.has(el.tagName)) return true;
    el = el.parentElement;
  }
  return false;
};

const readTextPartsDom = (root: HTMLElement): string[] => {
  const parts: string[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

  let node: Node | null;
  while ((node = walker.nextNode())) {
    const text = node.textContent?.trim();
    if (text && !isInsideSkippedTagDom(node)) parts.push(text);
  }

  return parts;
};

const getParsedContentDom = (el: HTMLElement): string => readTextPartsDom(el).join('\n');

export const getParsedContentsDom = (elements: HTMLElement[]): string =>
  elements
    .map((el) => getParsedContentDom(el))
    .filter(Boolean)
    .join('\n');

export const getOriginalTextDom = (el: HTMLElement): string => {
  const spans = el.querySelectorAll<HTMLElement>(SEGMENT_SELECTOR);
  if (spans.length) {
    return Array.from(spans)
      .map((span) => span.getAttribute('data-original') ?? span.textContent ?? '')
      .join(' ');
  }

  return readTextPartsDom(el).join(' ');
};
