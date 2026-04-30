// ControlPanel/SettingsPanel.tsx — Settings panel: language select + display toggles

import type React from 'react';

import { Select } from '../../../components/Select';
import { Toggle } from '../../../components/Toggle';
import { LANGUAGES } from '../../../constants/languages';
import { ThemeEnum } from '../../../enums';
import { useGlobalStore } from '../../../store/global';

export const SettingsPanel: React.FC = () => {
  const {
    theme,
    targetLanguage,
    alwaysShowTranslated,
    autoTranslateTask,
    autoTranslateAll,
    showSidebar,
    syncToDb,
    updateSettings,
  } = useGlobalStore();

  return (
    <div className="space-y-4">
      <Select
        label="Your language"
        value={targetLanguage}
        options={LANGUAGES.map((lang) => ({ value: lang, label: lang }))}
        onChange={(v) => updateSettings({ targetLanguage: v })}
      />

      {/* Auto-translate — actions that fire on page load */}
      <div className="space-y-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
          Auto-translate
        </p>
        <Toggle
          label="Auto-show saved translations"
          sublabel="On page load, re-apply the last saved translation for each block — no API call"
          checked={alwaysShowTranslated}
          onChange={(v) => updateSettings({ alwaysShowTranslated: v })}
        />
        <Toggle
          label="Auto-translate each block"
          sublabel="On page load, translate every block individually — uses saved translation if available, otherwise calls API"
          checked={autoTranslateTask}
          onChange={(v) => updateSettings({ autoTranslateTask: v })}
        />
        <Toggle
          label="Auto-translate all blocks at once"
          sublabel="On page load, fire the Translate All action — translates every block in one batch via API"
          checked={autoTranslateAll}
          onChange={(v) => updateSettings({ autoTranslateAll: v })}
        />
      </div>

      {/* Display — visual preferences */}
      <div className="space-y-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
          Display
        </p>
        <Toggle
          label="Show sidebar"
          sublabel="Display the translation history sidebar"
          checked={showSidebar}
          onChange={(v) => updateSettings({ showSidebar: v })}
        />
        <Toggle
          label="Dark mode"
          checked={theme === ThemeEnum.Dark}
          onChange={(v) => updateSettings({ theme: v ? ThemeEnum.Dark : ThemeEnum.Light })}
        />
      </div>

      {/* Data */}
      <div className="space-y-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
          Data
        </p>
        <Toggle
          label="Sync history to server"
          sublabel="Saves translation history to the backend database"
          checked={syncToDb}
          onChange={(v) => updateSettings({ syncToDb: v })}
        />
      </div>
    </div>
  );
};
