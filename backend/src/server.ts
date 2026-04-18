// server.ts — Express server providing translation via configurable LLM provider

import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createProvider } from './providers';

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

app.use((req, res, next) => {

  console.log(req.method, req.url);

  next();

});
app.use(cors());
app.options('*', cors());
app.use(express.json());

const provider = createProvider();

app.post('/translate', async (req: Request, res: Response) => {
  const { text, targetLanguage } = req.body as { text?: string; targetLanguage?: string };

  if (!text || !targetLanguage) {
    res.status(400).json({ error: 'text and targetLanguage are required' });
    return;
  }

  try {
    const translatedText = await provider.translate(text, targetLanguage);
    res.json({ translatedText });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Translation failed';
    console.error('Translation error:', message);
    res.status(500).json({ error: message });
  }
});

app.listen(port, () => {
  console.log(`Translation server running on http://localhost:${port} [${process.env.LLM_PROVIDER || 'openai'}]`);
});
