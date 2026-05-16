// dom/PlatformDomTextMutator.ts — Marks, applies, and restores text segments on one or many live platform DOM elements

import { nanoid } from 'nanoid';

import { getSegmentSelector, SEGMENT_ID_DATASET_KEY } from '../../constants/dom';
import type { TranslatedSegment, TranslateSegment } from '../../types';
import { PlatformDomTextReader } from './PlatformDomTextReader';

export class PlatformDomTextMutator {
  constructor(private readonly roots: HTMLElement | HTMLElement[]) {}

  private readonly platformDomTextReader = new PlatformDomTextReader();

  private getRoots(): HTMLElement[] {
    return Array.isArray(this.roots) ? this.roots : [this.roots];
  }

  /**
   * Walks all roots, wraps each readable text node in a span with a segment id, and returns all segments.
   * Collects all text nodes before modifying DOM — modifying inside a TreeWalker loop breaks traversal.
   */
  extractAndMark(): TranslateSegment[] {
    return this.getRoots().flatMap((root) => this.extractAndMarkRoot(root));
  }

  private extractAndMarkRoot(root: HTMLElement): TranslateSegment[] {
    const textNodes = this.platformDomTextReader.getReadableTextNodes(root);

    return textNodes.map((textNode) => {
      const text = textNode.textContent ?? '';
      const id = nanoid(8);
      const span = document.createElement('span');
      span.dataset[SEGMENT_ID_DATASET_KEY] = id;
      span.textContent = text;
      textNode.parentNode!.replaceChild(span, textNode);
      return { id, text };
    });
  }

  /**
   * Writes translated text into each segment span across all roots. Stores the original in data-original.
   */
  apply(segments: TranslatedSegment[]): void {
    this.getRoots().forEach((root) => {
      segments.forEach(({ id, text, translatedText }) => {
        const el = root.querySelector(getSegmentSelector(id));
        if (!el) return;
        el.setAttribute('data-original', text);
        el.textContent = translatedText;
      });
    });
  }

  /**
   * Restores the original text in each segment span across all roots.
   */
  restore(segments: TranslatedSegment[]): void {
    this.getRoots().forEach((root) => {
      segments.forEach(({ id, text }) => {
        const el = root.querySelector(getSegmentSelector(id));
        if (el) el.textContent = text;
      });
    });
  }
}
