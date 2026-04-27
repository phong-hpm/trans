// db/index.ts — Mock database layer: reads and writes db.json as if it were MongoDB
// Replace the read/write functions here to switch to a real MongoDB connection

import fs from 'fs';
import path from 'path';

import type { HistoryDocument } from '@/models/history.model';

interface Database {
  histories: HistoryDocument[];
}

const DB_PATH = path.join(__dirname, '../../temp/db.json');

const read = (): Database => {
  if (!fs.existsSync(DB_PATH)) return { histories: [] };
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) as Database;
};

const write = (data: Database): void => {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
};

export { read, write };
