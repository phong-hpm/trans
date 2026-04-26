// providers.ts — Available LLM providers and their supported models

import { ModelEnum, ProviderEnum } from '../enums';

export const PROVIDERS: { value: ProviderEnum; label: string }[] = [
  { value: ProviderEnum.OpenAI, label: 'OpenAI' },
  { value: ProviderEnum.Gemini, label: 'Google Gemini' },
];

export const MODELS: Record<ProviderEnum, { value: ModelEnum; label: string }[]> = {
  [ProviderEnum.OpenAI]: [
    { value: ModelEnum.GPT4oMini, label: 'GPT-4o Mini' },
    { value: ModelEnum.GPT4o, label: 'GPT-4o' },
  ],
  [ProviderEnum.Gemini]: [
    { value: ModelEnum.Gemini25Flash, label: 'Gemini 2.5 Flash' },
    { value: ModelEnum.Gemini20Flash, label: 'Gemini 2.0 Flash' },
  ],
};
