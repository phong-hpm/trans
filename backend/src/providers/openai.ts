// openai.ts — Translation provider using OpenAI Chat Completions

import OpenAI from 'openai';
import { TranslationProvider, buildSystemPrompt } from './types';

export class OpenAIProvider implements TranslationProvider {
  private client: OpenAI;
  private model: string;

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  async translate(text: string, targetLanguage: string): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: buildSystemPrompt(targetLanguage) },
        { role: 'user', content: text },
      ],
    });
    return completion.choices[0]?.message?.content ?? '';
  }
}
