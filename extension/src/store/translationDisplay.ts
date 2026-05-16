// translationDisplay.ts — Zustand store tracking which blocks are currently showing translated text

import { create } from 'zustand';

interface TranslationDisplayStore {
  translatedBlocks: Set<string>;
  showTranslation: (parsedContent: string) => void;
  showOriginal: (parsedContent: string) => void;
  isShowingTranslation: (parsedContent: string) => boolean;
  clear: () => void;
}

export const useTranslationDisplayStore = create<TranslationDisplayStore>((set, get) => ({
  translatedBlocks: new Set<string>(),

  showTranslation: (parsedContent) =>
    set((state) => ({
      translatedBlocks: new Set(state.translatedBlocks).add(parsedContent),
    })),

  showOriginal: (parsedContent) =>
    set((state) => {
      const next = new Set(state.translatedBlocks);
      next.delete(parsedContent);
      return { translatedBlocks: next };
    }),

  isShowingTranslation: (parsedContent) => get().translatedBlocks.has(parsedContent),

  clear: () => set({ translatedBlocks: new Set<string>() }),
}));
