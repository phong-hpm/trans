// index.ts — Google Gemini translation provider (client initialized per-call to avoid missing-key errors at startup)

import type { TranslationProvider } from '@/providers/types';
import { buildPrompt } from './prompt';

export const geminiProvider: TranslationProvider = {
  async translate(segments, targetLanguage, model) {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

    const instance = genAI.getGenerativeModel({
      model,
      systemInstruction: buildPrompt(targetLanguage),
    });

    const result = await instance.generateContent(JSON.stringify(segments));
    const raw = result.response.text();
    const cleaned = raw.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(cleaned) as { id: string; translatedText: string }[];
  },
};
