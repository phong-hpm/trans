// db/index.ts — Mock database layer: reads and writes db.json as if it were MongoDB
// Replace the read/write functions here to switch to a real MongoDB connection

import fs from 'fs';
import path from 'path';

import type { HistoryDocument } from '@/models/history.model';

interface Database {
  histories: HistoryDocument[];
}

const DB_PATH = path.join(__dirname, '../../temp/db.json');

// In-memory cache — populated on first read, invalidated on every write
let _cache: Database | null = null;

const read = (): Database => {
  if (_cache) return _cache;
  if (!fs.existsSync(DB_PATH)) {
    _cache = { histories: [] };
    return _cache;
  }
  _cache = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) as Database;
  return _cache;
};

const write = (data: Database): void => {
  _cache = data;
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
};

export { read, write };
