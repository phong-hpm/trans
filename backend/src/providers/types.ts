// types.ts — Shared interface for all LLM translation providers

export interface TranslationProvider {
  translate(text: string, targetLanguage: string): Promise<string>;
}

export const buildSystemPrompt = (targetLanguage: string) =>
  `You are a professional translator. Translate the following text to ${targetLanguage}. Preserve all markdown formatting, code blocks, inline code, URLs, and technical terms. Return only the translated text without any explanation or preamble.`;
