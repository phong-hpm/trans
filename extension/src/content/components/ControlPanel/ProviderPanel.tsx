// ControlPanel/ProviderPanel.tsx — AI provider panel: provider, model, and user context

import type React from 'react';

import { Select } from '../../../components/Select';
import { TextareaInput } from '../../../components/TextareaInput';
import { MODELS, PROVIDERS } from '../../../constants/providers';
import type { ProviderEnum } from '../../../enums';
import { useGlobalStore } from '../../../store/global';

export const ProviderPanel: React.FC = () => {
  const { provider, model, userContext, platformName, targetLanguage, updateSettings } =
    useGlobalStore();

  const handleProviderChange = (newProvider: string) => {
    const p = newProvider as ProviderEnum;
    updateSettings({ provider: p, model: MODELS[p]?.[0]?.value ?? '' });
  };

  const platform = platformName ?? 'your issue tracker';
  const language = targetLanguage ?? 'your target language';
  const example = `e.g. I am a frontend developer working on a React + TypeScript SaaS product. My team writes ${platform} issues in a mix of ${language} and the original language. I prefer concise, technically accurate translations that use standard developer terminology.`;

  return (
    <div className="space-y-3">
      <Select
        label="Provider"
        value={provider}
        options={PROVIDERS}
        onChange={handleProviderChange}
      />
      <Select
        label="Model"
        disabled
        value={model}
        options={MODELS[provider as ProviderEnum] ?? []}
        onChange={(v) => updateSettings({ model: v })}
      />
      <TextareaInput
        label="About you"
        rows={4}
        value={userContext}
        onChange={(e) => updateSettings({ userContext: e.target.value })}
        helpText={
          <>
            Describe your role and context so the AI can tailor translations to your domain. This is
            sent with every translation request.
            <br />
            <span className="text-gray-300 dark:text-gray-600">{example}</span>
          </>
        }
      />
    </div>
  );
};
