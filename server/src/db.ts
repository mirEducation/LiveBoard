import Database from 'better-sqlite3';
import path from 'path';
import { Shape } from './types';

const DB_PATH = path.join(__dirname, '..', 'whiteboard.db');

const db = new Database(DB_PATH);

// Enable WAL for better concurrency
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS boards (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT 'Untitled Board',
    shapes_json TEXT NOT NULL DEFAULT '{}',
    created_at INTEGER NOT NULL,
    last_active_at INTEGER NOT NULL
  )
`);

export interface BoardRow {
  id: string;
  title: string;
  shapes_json: string;
  created_at: number;
  last_active_at: number;
}

const stmtGet = db.prepare<[string]>('SELECT * FROM boards WHERE id = ?');
const stmtInsert = db.prepare<[string, string, string, number, number]>(
  'INSERT OR IGNORE INTO boards (id, title, shapes_json, created_at, last_active_at) VALUES (?, ?, ?, ?, ?)'
);
const stmtUpdateShapes = db.prepare<[string, number, string]>(
  'UPDATE boards SET shapes_json = ?, last_active_at = ? WHERE id = ?'
);
const stmtUpdateTitle = db.prepare<[string, number, string]>(
  'UPDATE boards SET title = ?, last_active_at = ? WHERE id = ?'
);
const stmtUpdateActivity = db.prepare<[number, string]>(
  'UPDATE boards SET last_active_at = ? WHERE id = ?'
);
const stmtDeleteOld = db.prepare<[number]>(
  'DELETE FROM boards WHERE last_active_at < ?'
);

export function getBoard(id: string): BoardRow | undefined {
  return stmtGet.get(id) as BoardRow | undefined;
}

export function createBoard(id: string): BoardRow {
  const now = Date.now();
  stmtInsert.run(id, 'Untitled Board', '{}', now, now);
  return getBoard(id)!;
}

export function saveShapes(boardId: string, shapes: Record<string, Shape>): void {
  stmtUpdateShapes.run(JSON.stringify(shapes), Date.now(), boardId);
}

export function saveTitle(boardId: string, title: string): void {
  stmtUpdateTitle.run(title, Date.now(), boardId);
}

export function touchBoard(boardId: string): void {
  stmtUpdateActivity.run(Date.now(), boardId);
}

export function deleteOldBoards(maxAgeMs: number): number {
  const cutoff = Date.now() - maxAgeMs;
  const result = stmtDeleteOld.run(cutoff);
  return result.changes;
}

export default db;
