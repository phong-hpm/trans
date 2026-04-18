// server.ts — Express server providing translation via configurable LLM provider

import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createProvider } from './providers';

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

app.use((req, _res, next) => {
  console.log(req.method, req.url);
  next();
});
app.use(cors());
app.options('*', cors());
app.use(express.json());

const provider = createProvider();

interface TranslateSegment {
  id: string;
  text: string;
}

app.post('/translate', async (req: Request, res: Response) => {
  const { segments, targetLanguage } = req.body as {
    segments?: TranslateSegment[];
    targetLanguage?: string;
  };

  if (!segments?.length || !targetLanguage) {
    res.status(400).json({ error: 'segments and targetLanguage are required' });
    return;
  }

  try {
    const raw = await provider.translate(JSON.stringify(segments), targetLanguage);

    // Strip markdown fences if the model wraps the response
    const cleaned = raw.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    const translated = JSON.parse(cleaned) as { id: string; translatedText: string }[];

    res.json({ segments: translated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Translation failed';
    console.error('Translation error:', message);
    res.status(500).json({ error: message });
  }
});

app.listen(port, () => {
  console.log(
    `Translation server running on http://localhost:${port} [${process.env.LLM_PROVIDER || 'openai'}]`
  );
});
