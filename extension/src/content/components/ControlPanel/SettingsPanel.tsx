// ControlPanel/SettingsPanel.tsx — Settings panel: language select + display toggles

import type React from 'react';

import { Select } from '../../../components/Select';
import { Toggle } from '../../../components/Toggle';
import { LANGUAGES } from '../../../constants/languages';
import { ThemeEnum } from '../../../enums';
import { useGlobalStore } from '../../../store/global';

export const SettingsPanel: React.FC = () => {
  const { theme, targetLanguage, alwaysShowTranslated, showSidebar, updateSettings } =
    useGlobalStore();

  return (
    <div className="space-y-3">
      <Select
        label="Your language"
        value={targetLanguage}
        options={LANGUAGES.map((lang) => ({ value: lang, label: lang }))}
        onChange={(v) => updateSettings({ targetLanguage: v })}
      />
      <div className="pt-1 space-y-2.5">
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
      </div>
    </div>
  );
};
