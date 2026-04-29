// config/models.ts — Allowed model lists per provider, computed once at startup from env vars

export const ALLOWED_MODELS: Record<string, string[]> = {
  openai: (process.env.OPENAI_ALLOWED_MODELS ?? '')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean),
  gemini: (process.env.GEMINI_ALLOWED_MODELS ?? '')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean),
};
