// types.ts — TranslationProvider interface

export interface TranslationProvider {
  translate(segments: { id: string; text: string }[], targetLanguage: string, model: string): Promise<{ id: string; translatedText: string }[]>;
}
