/**
 * SQLite schema for the Lex4 project memory database.
 *
 * This database is a committed project artifact — not disposable cache.
 * It stores development history: prompts, plans, decisions, bugs, fixes,
 * and implementation notes for future developers.
 */

/** Valid entry type categories */
export const ENTRY_TYPES = [
  'prompt',
  'plan',
  'step',
  'decision',
  'bug',
  'fix',
  'test',
  'note',
  'backlog',
] as const;

export type EntryType = (typeof ENTRY_TYPES)[number];

/** Valid entry statuses */
export const ENTRY_STATUSES = [
  'active',
  'completed',
  'superseded',
  'archived',
] as const;

export type EntryStatus = (typeof ENTRY_STATUSES)[number];

/** Shape of a memory entry */
export interface MemoryEntry {
  id: number;
  created_at: string;
  updated_at: string;
  entry_type: EntryType;
  title: string;
  content: string;
  tags: string | null;
  status: EntryStatus;
  related_files: string | null;
  component: string | null;
}

/** Input for creating a new entry (id and timestamps auto-generated) */
export type NewMemoryEntry = Omit<MemoryEntry, 'id' | 'created_at' | 'updated_at'>;

/** Input for updating an existing entry */
export type MemoryEntryUpdate = Partial<Omit<MemoryEntry, 'id' | 'created_at'>>;

/** SQL statement to create the memory_entries table */
export const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS memory_entries (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  entry_type    TEXT NOT NULL CHECK(entry_type IN ('prompt','plan','step','decision','bug','fix','test','note','backlog')),
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  tags          TEXT,
  status        TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','completed','superseded','archived')),
  related_files TEXT,
  component     TEXT
);
`;

/** SQL to create an index on entry_type for fast filtering */
export const CREATE_INDEX_SQL = `
CREATE INDEX IF NOT EXISTS idx_memory_entry_type ON memory_entries(entry_type);
`;
