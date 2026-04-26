// ControlPanel/ProviderPanel.tsx — AI provider panel: provider, model, and user context

import type React from 'react';

import { Select } from '../../../components/Select';
import { TextareaInput } from '../../../components/TextareaInput';
import { MODELS, PROVIDERS } from '../../../constants/providers';
import type { ProviderEnum } from '../../../enums';
import { useGlobalStore } from '../../../store/global';

const buildExample = (platform: string): string =>
  `e.g. I'm a frontend developer on a React + TypeScript SaaS. We track work in ${platform}. Prefer concise, technically accurate translations — keep common English terms like "modal", "debounce", or "input" as-is.`;

export const ProviderPanel: React.FC = () => {
  const { provider, model, userContext, platformName, updateSettings } = useGlobalStore();

  const handleProviderChange = (newProvider: string) => {
    const p = newProvider as ProviderEnum;
    updateSettings({ provider: p, model: MODELS[p]?.[0]?.value ?? '' });
  };

  const platform = platformName ?? 'your issue tracker';

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
        rows={5}
        value={userContext}
        onChange={(e) => updateSettings({ userContext: e.target.value })}
        helpText={
          <>
            Describe your role and context so the AI can tailor translations to your domain. This is
            sent with every translation request.
            <br />
            <span className="text-gray-400 dark:text-gray-600">{buildExample(platform)}</span>
          </>
        }
      />
    </div>
  );
};
