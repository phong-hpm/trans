// models/history.model.ts — MongoDB document schema for translation history

export interface HistoryEntry {
  id: string;
  segments: { text: string; translatedText: string }[];
  createdAt: number; // Unix ms — matches extension TranslationEntry format
  selected: boolean;
}

export interface HistoryDocument {
  _id: string;         // Composite key: `${pageUrl}:::${parsedContent}`
  parsedContent: string;
  pageUrl: string;
  entries: HistoryEntry[];
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
}
