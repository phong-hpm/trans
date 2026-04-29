// providers/openai/index.ts — OpenAI translation provider (lazy singleton client)

import OpenAI from 'openai';

import type { TranslationProvider } from '@/providers/types';

import { buildPrompt } from './prompt';

// Lazy singleton — initialized once on first use to avoid startup errors on missing key
let _client: OpenAI | null = null;
const getClient = (): OpenAI => {
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _client;
};

export const openaiProvider: TranslationProvider = {
  async translate({ segments, contextBlocks, targetLanguage, model, userContext }) {
    const client = getClient();

    const userMessage = JSON.stringify({ context: contextBlocks ?? [], segments });

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

    try {
      return JSON.parse(cleaned) as { id: string; translatedText: string }[];
    } catch {
      throw new Error(
        `[openai/${model}] Failed to parse response JSON. Raw: ${cleaned.slice(0, 200)}`
      );
    }
  },
};
