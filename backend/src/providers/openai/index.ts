// index.ts — OpenAI translation provider (client initialized per-call to avoid missing-key errors at startup)

import type { TranslationProvider } from '@/providers/types';
import { buildPrompt } from './prompt';

export const openaiProvider: TranslationProvider = {
  async translate(segments, targetLanguage, model) {
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: buildPrompt(targetLanguage) },
        { role: 'user', content: JSON.stringify(segments) },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? '';
    const cleaned = raw.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(cleaned) as { id: string; translatedText: string }[];
  },
};
