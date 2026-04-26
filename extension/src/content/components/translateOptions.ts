// translateOptions.ts — Translate mode options shared between TranslatePopup and TranslateToolbar

export interface TranslateOption {
  value: string;
  label: string;
  sublabel: string;
}

export const COMMENT_OPTIONS: TranslateOption[] = [
  {
    value: 'full',
    label: 'Full Context Translation',
    sublabel: 'Best accuracy – full task + all previous comments',
  },
  {
    value: 'context',
    label: 'Context-Aware Translation',
    sublabel: 'Balanced – task + this comment',
  },
  {
    value: 'direct',
    label: 'Direct Translation',
    sublabel: 'Lowest cost – this comment only',
  },
];

export const SIMPLE_OPTIONS: TranslateOption[] = [
  {
    value: 'translate',
    label: 'Translation',
    sublabel: 'Translate this section to your target language',
  },
];
