// types.ts — Shared interface for all LLM translation providers

export interface TranslationProvider {
  translate(text: string, targetLanguage: string): Promise<string>;
}

export const buildSystemPrompt = (targetLanguage: string) =>
  `You are a professional translator. Translate the following HTML to ${targetLanguage}. Rules: preserve all HTML tags and attributes exactly as-is, only translate visible text content, keep code blocks and technical terms untranslated, return only the translated HTML with no explanation or preamble.`;
