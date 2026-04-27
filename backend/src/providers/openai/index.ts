// index.ts — OpenAI translation provider (client initialized per-call to avoid missing-key errors at startup)

import OpenAI from 'openai';
import type { TranslationProvider } from '@/providers/types';
import { buildPrompt } from './prompt';

export const openaiProvider: TranslationProvider = {
  async translate({ segments, contextBlocks, targetLanguage, model, userContext }) {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const filteredSegments = segments.filter((s) => {
      const text = s.text.trim();

      if (!text) return false;

      const noisePatterns = [
        /^Move\s/i,
        /^Open\s/i,
        /task options/i,
        /To pick up a draggable item/i,
        /While dragging/i,
        /Press space again/i,
      ];

      return !noisePatterns.some((p) => p.test(text));
    });

    const userMessage = JSON.stringify({ context: contextBlocks ?? [], segments: filteredSegments });

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: buildPrompt(targetLanguage, userContext) },
        { role: 'user', content: userMessage },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? '';
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?\n?/, '')
      .replace(/\n?```$/, '');
    return JSON.parse(cleaned) as { id: string; translatedText: string }[];
  },
};
