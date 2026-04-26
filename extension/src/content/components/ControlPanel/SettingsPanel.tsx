// ControlPanel/SettingsPanel.tsx — Settings panel: toggles + language/provider/model selects

import type React from 'react';

import { Select } from '../../../components/Select';
import { Toggle } from '../../../components/Toggle';
import { LANGUAGES } from '../../../constants/languages';
import { MODELS, PROVIDERS } from '../../../constants/providers';
import type { ProviderEnum } from '../../../enums';
import { ThemeEnum } from '../../../enums';
import { useGlobalStore } from '../../../store/global';

export const SettingsPanel: React.FC = () => {
  const {
    theme,
    targetLanguage,
    provider,
    model,
    alwaysShowTranslated,
    showSidebar,
    updateSettings,
  } = useGlobalStore();

  const handleProviderChange = (newProvider: string) => {
    const p = newProvider as ProviderEnum;
    updateSettings({ provider: p, model: MODELS[p]?.[0]?.value ?? '' });
  };

  return (
    <div className="space-y-3">
      <Toggle
        label="Auto-show translations"
        checked={alwaysShowTranslated}
        onChange={(v) => updateSettings({ alwaysShowTranslated: v })}
      />
      <Toggle
        label="Dark mode"
        checked={theme === ThemeEnum.Dark}
        onChange={(v) => updateSettings({ theme: v ? ThemeEnum.Dark : ThemeEnum.Light })}
      />
      <Toggle
        label="Show sidebar"
        checked={showSidebar}
        onChange={(v) => updateSettings({ showSidebar: v })}
      />
      <div className="pt-1 space-y-2.5">
        <Select
          label="Your language"
          value={targetLanguage}
          options={LANGUAGES.map((lang) => ({ value: lang, label: lang }))}
          onChange={(v) => updateSettings({ targetLanguage: v })}
        />
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
      </div>
    </div>
  );
};
