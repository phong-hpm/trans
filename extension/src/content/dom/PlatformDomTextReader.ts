// dom/PlatformDomTextReader.ts — Read-only text access on one or many live platform DOM elements

import { SEGMENT_SELECTOR } from '../../constants/dom';

export class PlatformDomTextReader {
  private readonly skipTags = new Set(['CODE', 'PRE', 'SCRIPT', 'STYLE', 'KBD', 'VAR', 'SAMP']);

  private getRoots(roots: HTMLElement | HTMLElement[]): HTMLElement[] {
    return Array.isArray(roots) ? roots : [roots];
  }

  private isInsideSkipTag(node: Node): boolean {
    let el = node.parentElement;
    while (el) {
      if (this.skipTags.has(el.tagName)) return true;
      el = el.parentElement;
    }
    return false;
  }

  getReadableTextNodes(root: HTMLElement): Text[] {
    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (!node.textContent?.trim()) continue;
      if (this.isInsideSkipTag(node)) continue;
      textNodes.push(node as Text);
    }

    return textNodes;
  }

  private getTextParts(root: HTMLElement): string[] {
    return this.getReadableTextNodes(root).map((node) => node.textContent!.trim());
  }

  /**
   * Returns stable text across all roots joined by newlines.
   * Used as a history key / parsed block identifier.
   */
  getParsedText(roots: HTMLElement | HTMLElement[]): string {
    return this.getRoots(roots)
      .map((root) => this.getTextParts(root).join('\n'))
      .filter(Boolean)
      .join('\n');
  }

  /**
   * Returns source text across all roots joined by spaces.
   * If translated segment spans exist, reads data-original first (fallback to span text).
   * Used to build context for AI translation.
   */
  getSourceText(roots: HTMLElement | HTMLElement[]): string {
    return this.getRoots(roots)
      .map((root) => {
        const spans = root.querySelectorAll<HTMLElement>(SEGMENT_SELECTOR);
        if (spans.length) {
          return Array.from(spans)
            .map((span) => span.getAttribute('data-original') ?? span.textContent ?? '')
            .join(' ');
        }
        return this.getTextParts(root).join(' ');
      })
      .filter(Boolean)
      .join(' ');
  }
}
