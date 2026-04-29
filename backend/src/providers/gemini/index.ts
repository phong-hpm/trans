// providers/gemini/index.ts — Google Gemini translation provider (lazy singleton client)

import { GoogleGenerativeAI } from '@google/generative-ai';

import type { TranslationProvider } from '@/providers/types';

import { buildPrompt } from './prompt';

// Lazy singleton — initialized once on first use to avoid startup errors on missing key
let _genAI: GoogleGenerativeAI | null = null;
const getClient = (): GoogleGenerativeAI => {
  if (!_genAI) _genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');
  return _genAI;
};

export const geminiProvider: TranslationProvider = {
  async translate({ segments, contextBlocks, targetLanguage, model, userContext }) {
    const genAI = getClient();

    const instance = genAI.getGenerativeModel({
      model,
      systemInstruction: buildPrompt(targetLanguage, userContext),
    });

    const userMessage = JSON.stringify({ context: contextBlocks ?? [], segments });

    const result = await instance.generateContent(userMessage);
    const raw = result.response.text();
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?\n?/, '')
      .replace(/\n?```$/, '');

    try {
      return JSON.parse(cleaned) as { id: string; translatedText: string }[];
    } catch {
      throw new Error(
        `[gemini/${model}] Failed to parse response JSON. Raw: ${cleaned.slice(0, 200)}`
      );
    }
  },
};
