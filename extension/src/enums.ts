// enums.ts — All enum definitions for the extension

export enum MessageTypeEnum {
  Translate = 'TRANSLATE',
  BatchTranslate = 'BATCH_TRANSLATE',
  DevLog = 'DEV_LOG',
  ToggleModal = 'TOGGLE_MODAL',
}

export enum LogTypeEnum {
  Call = 'call',
  Response = 'response',
  Error = 'error',
}

export enum BlockTypeEnum {
  Title = 'title',
  Task = 'task',
  Comment = 'comment',
}

export enum ThemeEnum {
  Light = 'light',
  Dark = 'dark',
}

export enum SidebarModeEnum {
  Drawer = 'drawer',
  Page = 'page',
}

export enum SidebarTabEnum {
  History = 'history',
}

export enum TranslateStateEnum {
  Idle = 'idle',
  Loading = 'loading',
  Translated = 'translated',
}

export enum ProviderEnum {
  OpenAI = 'openai',
  Gemini = 'gemini',
}

export enum ModelEnum {
  GPT4oMini = 'gpt-4o-mini',
  GPT4o = 'gpt-4o',
  Gemini25Flash = 'gemini-2.5-flash',
  Gemini20Flash = 'gemini-2.0-flash',
}
