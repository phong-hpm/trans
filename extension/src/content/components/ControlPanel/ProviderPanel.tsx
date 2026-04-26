// ControlPanel/ProviderPanel.tsx — AI provider panel: provider, model, and user context

import type React from 'react';

import { Select } from '../../../components/Select';
import { TextareaInput } from '../../../components/TextareaInput';
import { MODELS, PROVIDERS } from '../../../constants/providers';
import type { ProviderEnum } from '../../../enums';
import { useGlobalStore } from '../../../store/global';

const buildExample = (platform: string): string =>
  [
    `• I'm a frontend developer working on a React + TypeScript SaaS product`,
    `• Our team tracks bugs and features in ${platform}`,
    `• Prefer concise, technically accurate phrasing using standard developer terminology`,
    `• Keep UI copy short — labels, button text, and error messages should be direct`,
    `• Do not over-translate idioms; if a term is widely used in English (e.g. "debounce", "modal"), keep it`,
  ].join('\n');

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
            <span className="text-gray-400 dark:text-gray-600 whitespace-pre-line">
              {buildExample(platform)}
            </span>
          </>
        }
      />
    </div>
  );
};
