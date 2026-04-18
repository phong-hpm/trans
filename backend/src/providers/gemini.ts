// gemini.ts — Translation provider using Google Gemini

import { GoogleGenerativeAI } from '@google/generative-ai';
import { TranslationProvider, buildSystemPrompt } from './types';

export class GeminiProvider implements TranslationProvider {
  private genAI: GoogleGenerativeAI;
  private model: string;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');
    this.model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  }

  async translate(text: string, targetLanguage: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({
      model: this.model,
      systemInstruction: buildSystemPrompt(targetLanguage),
    });
    const result = await model.generateContent(text);
    return result.response.text();
  }
}
